"""
Genomic Plant Health Platform -- Backend
Run with: uvicorn app.main:app --reload --port 8000
Docs auto-generated at http://localhost:8000/docs
"""
import json
import os
import sys
from datetime import datetime
from typing import List

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from . import models, schemas
from .database import engine, get_db, Base
from .services.vcf_parser import parse_vcf_text
from .services.risk_engine import (
    compute_disease_risk, EnvSnapshot, GenomicEvidence
)

# ml/ lives as a sibling of backend/ -- see ../ml
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "ml"))
try:
    from predict import predict_risk_ml
    ML_AVAILABLE = True
except Exception:
    ML_AVAILABLE = False

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Genomic Plant Health Platform API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten before real deployment
    allow_methods=["*"],
    allow_headers=["*"],
)

DISEASES = ["Early Blight", "Late Blight", "Fusarium Wilt"]

DISCLAIMER = (
    "Risk scores are evidence-weighted heuristics derived from public "
    "genomic datasets and published literature associations, combined "
    "with live environmental readings. They are NOT calibrated clinical "
    "probabilities and have not been field-validated. See report sources "
    "for citations."
)


# ---------- Startup: seed knowledge base + gene coordinates if empty ----------
@app.on_event("startup")
def seed_knowledge_base():
    db = next(get_db())

    if db.query(models.Association).count() == 0:
        seed_path = os.path.join(os.path.dirname(__file__), "..", "data", "knowledge_base_seed.json")
        with open(seed_path) as f:
            data = json.load(f)
        for assoc in data["associations"]:
            db.add(models.Association(
                gene_symbol=assoc["gene_symbol"],
                chromosome=assoc["chromosome"],
                disease=assoc["disease"],
                association_type=assoc["association_type"],
                evidence_level=assoc["evidence_level"],
                source_citation=assoc["source_citation"],
                description=assoc.get("description"),
            ))
        db.commit()

    if db.query(models.GeneCoordinate).count() == 0:
        coord_path = os.path.join(os.path.dirname(__file__), "..", "data", "gene_coordinates_seed.json")
        with open(coord_path) as f:
            coord_data = json.load(f)
        for gene in coord_data["genes"]:
            db.add(models.GeneCoordinate(
                gene_symbol=gene["gene_symbol"],
                chromosome=gene["chromosome"],
                start=gene.get("start"),
                end=gene.get("end"),
                position_type=gene["position_type"],
                source_citation=gene["source_citation"],
            ))
        db.commit()

    db.close()


def match_variant_to_gene(db: Session, chromosome: str, position: int) -> str | None:
    """
    Position-range matching where we have a verified window; falls back to
    chromosome-only matching (with a wider net) for genes honestly flagged
    as position-unresolved, e.g. Ph-3. This mirrors exactly what's
    documented in gene_coordinates_seed.json -- no invented precision.
    """
    ranged = db.query(models.GeneCoordinate).filter(
        models.GeneCoordinate.chromosome == chromosome,
        models.GeneCoordinate.start.isnot(None),
        models.GeneCoordinate.start <= position,
        models.GeneCoordinate.end >= position,
    ).first()
    if ranged:
        return ranged.gene_symbol

    chrom_only = db.query(models.GeneCoordinate).filter(
        models.GeneCoordinate.chromosome == chromosome,
        models.GeneCoordinate.start.is_(None),
    ).first()
    if chrom_only:
        return chrom_only.gene_symbol

    return None


# ---------- Plant registration ----------
@app.post("/api/plants", response_model=schemas.PlantOut)
def register_plant(plant: schemas.PlantCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Plant).filter(models.Plant.plant_code == plant.plant_code).first()
    if existing:
        raise HTTPException(400, "plant_code already registered")
    db_plant = models.Plant(**plant.dict())
    db.add(db_plant)
    db.commit()
    db.refresh(db_plant)
    return db_plant


@app.get("/api/plants", response_model=List[schemas.PlantOut])
def list_plants(db: Session = Depends(get_db)):
    return db.query(models.Plant).all()


@app.get("/api/plants/{plant_code}", response_model=schemas.PlantOut)
def get_plant(plant_code: str, db: Session = Depends(get_db)):
    plant = db.query(models.Plant).filter(models.Plant.plant_code == plant_code).first()
    if not plant:
        raise HTTPException(404, "plant not found")
    return plant


# ---------- VCF upload + variant parsing ----------
@app.post("/api/plants/{plant_code}/upload-vcf")
async def upload_vcf(plant_code: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    plant = db.query(models.Plant).filter(models.Plant.plant_code == plant_code).first()
    if not plant:
        raise HTTPException(404, "plant not found -- register the plant first")

    content = (await file.read()).decode("utf-8", errors="ignore")
    parsed = parse_vcf_text(content)

    if not parsed:
        raise HTTPException(400, "no variants parsed -- check file is valid VCF text")

    linked_count = 0
    for pv in parsed:
        # find or create the reference variant record
        variant = db.query(models.Variant).filter(
            models.Variant.chromosome == pv.chromosome,
            models.Variant.position == pv.position,
            models.Variant.alt_allele == pv.alt_allele,
        ).first()

        if not variant:
            # gene annotation: real position-range matching where we have
            # verified coordinates (I-2, I-3), honest chromosome-level
            # fallback where we don't (Ph-3) -- see gene_coordinates_seed.json
            gene_symbol = match_variant_to_gene(db, pv.chromosome, pv.position)
            variant = models.Variant(
                chromosome=pv.chromosome,
                position=pv.position,
                ref_allele=pv.ref_allele,
                alt_allele=pv.alt_allele,
                gene_symbol=gene_symbol,
            )
            db.add(variant)
            db.flush()

        db.add(models.PlantVariant(plant_id=plant.id, variant_id=variant.id, genotype=pv.genotype))
        linked_count += 1

    db.commit()
    return {"plant_code": plant_code, "variants_parsed": len(parsed), "variants_linked": linked_count}


@app.get("/api/plants/{plant_code}/variants", response_model=List[schemas.VariantOut])
def get_plant_variants(plant_code: str, db: Session = Depends(get_db)):
    plant = db.query(models.Plant).filter(models.Plant.plant_code == plant_code).first()
    if not plant:
        raise HTTPException(404, "plant not found")
    variants = [pv.variant for pv in plant.variants]
    return variants


# ---------- Environmental sensor ingestion (ESP32 posts here) ----------
@app.post("/api/sensor-data", response_model=schemas.EnvironmentOut)
def ingest_sensor_data(reading: schemas.EnvironmentIn, db: Session = Depends(get_db)):
    plant = db.query(models.Plant).filter(models.Plant.plant_code == reading.plant_id).first()
    if not plant:
        raise HTTPException(404, f"unknown plant_id '{reading.plant_id}' -- register plant first")

    db_reading = models.EnvironmentReading(
        plant_id=plant.id,
        temperature=reading.temperature,
        humidity=reading.humidity,
        soil_moisture=reading.soil_moisture,
        light=reading.light,
    )
    db.add(db_reading)
    db.commit()
    db.refresh(db_reading)
    return db_reading


@app.get("/api/plants/{plant_code}/environment/latest", response_model=schemas.EnvironmentOut)
def latest_environment(plant_code: str, db: Session = Depends(get_db)):
    plant = db.query(models.Plant).filter(models.Plant.plant_code == plant_code).first()
    if not plant:
        raise HTTPException(404, "plant not found")
    reading = (
        db.query(models.EnvironmentReading)
        .filter(models.EnvironmentReading.plant_id == plant.id)
        .order_by(models.EnvironmentReading.timestamp.desc())
        .first()
    )
    if not reading:
        raise HTTPException(404, "no environment readings yet")
    return reading


# ---------- Risk analysis (the core deliverable) ----------
@app.get("/api/plants/{plant_code}/risk", response_model=schemas.RiskReport)
def analyze_risk(plant_code: str, db: Session = Depends(get_db)):
    plant = db.query(models.Plant).filter(models.Plant.plant_code == plant_code).first()
    if not plant:
        raise HTTPException(404, "plant not found")

    # latest environment snapshot (falls back to empty -> engine handles gracefully)
    latest_env = (
        db.query(models.EnvironmentReading)
        .filter(models.EnvironmentReading.plant_id == plant.id)
        .order_by(models.EnvironmentReading.timestamp.desc())
        .first()
    )
    env = EnvSnapshot(
        temperature=latest_env.temperature if latest_env else None,
        humidity=latest_env.humidity if latest_env else None,
        soil_moisture=latest_env.soil_moisture if latest_env else None,
        light=latest_env.light if latest_env else None,
    )

    # genes detected in this plant's variants
    plant_gene_symbols = {
        pv.variant.gene_symbol for pv in plant.variants if pv.variant.gene_symbol
    }

    results = []
    for disease in DISEASES:
        associations = db.query(models.Association).filter(models.Association.disease == disease).all()
        matched_evidence = [
            GenomicEvidence(
                gene_symbol=a.gene_symbol,
                association_type=a.association_type,
                evidence_level=a.evidence_level.split(" ")[0],  # "strong (cloned gene)" -> "strong"
                source_citation=a.source_citation,
            )
            for a in associations
            if a.gene_symbol in plant_gene_symbols
        ]

        result = compute_disease_risk(disease, matched_evidence, env)

        ml_pred = None
        if ML_AVAILABLE and all(v is not None for v in [env.temperature, env.humidity, env.soil_moisture, env.light]):
            try:
                raw = predict_risk_ml(
                    disease,
                    resistance_gene_count=len(matched_evidence),
                    temperature=env.temperature,
                    humidity=env.humidity,
                    soil_moisture=env.soil_moisture,
                    light=env.light,
                )
                ml_pred = schemas.MLRiskPrediction(**raw)
            except FileNotFoundError:
                ml_pred = None  # models not trained yet -- rule engine still works standalone

        db.add(models.RiskScore(
            plant_id=plant.id,
            disease=disease,
            risk_level=result.risk_level,
            risk_score=result.risk_score,
            explanation_json=json.dumps(result.__dict__),
        ))

        results.append(schemas.DiseaseRisk(
            disease=result.disease,
            risk_level=result.risk_level,
            risk_score=result.risk_score,
            evidence_level=result.evidence_level,
            contributing_variants=result.contributing_variants,
            environmental_factors=result.environmental_factors,
            explanation=result.explanation,
            ml_prediction=ml_pred,
        ))

    db.commit()

    return schemas.RiskReport(
        plant_code=plant_code,
        generated_at=datetime.utcnow(),
        disclaimer=DISCLAIMER,
        results=results,
    )


@app.get("/")
def root():
    return {"status": "ok", "service": "genomic-plant-health-api"}
