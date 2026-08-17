"""
ORM models. Mirrors the knowledge-base schema from the project plan:
plants, variants, associations, environment, risk_scores.
"""
from sqlalchemy import (
    Column, Integer, String, Float, ForeignKey, DateTime, Text
)
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base


class Plant(Base):
    __tablename__ = "plants"

    id = Column(Integer, primary_key=True, index=True)
    plant_code = Column(String, unique=True, index=True)   # e.g. "TOMATO-001"
    species = Column(String, default="Solanum lycopersicum")
    variety = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    variants = relationship("PlantVariant", back_populates="plant")
    environment_readings = relationship("EnvironmentReading", back_populates="plant")
    risk_scores = relationship("RiskScore", back_populates="plant")


class Variant(Base):
    """
    Reference variant catalog. Position-level data comes from public VCFs
    (SolGenomics tomato resequencing project). gene_symbol links to the
    literature-sourced associations table.
    """
    __tablename__ = "variants"

    id = Column(Integer, primary_key=True, index=True)
    chromosome = Column(String, index=True)
    position = Column(Integer, index=True)
    ref_allele = Column(String)
    alt_allele = Column(String)
    gene_symbol = Column(String, nullable=True, index=True)
    consequence = Column(String, nullable=True)   # e.g. missense, synonymous
    source_dataset = Column(String, default="SolGenomics tomato resequencing")


class PlantVariant(Base):
    """Which variants were detected in a specific plant sample's uploaded VCF."""
    __tablename__ = "plant_variants"

    id = Column(Integer, primary_key=True, index=True)
    plant_id = Column(Integer, ForeignKey("plants.id"))
    variant_id = Column(Integer, ForeignKey("variants.id"))
    genotype = Column(String, nullable=True)   # e.g. 0/1, 1/1

    plant = relationship("Plant", back_populates="variants")
    variant = relationship("Variant")


class Association(Base):
    """
    Literature-sourced evidence linking a gene/variant to a disease trait.
    evidence_level distinguishes strong single-gene evidence (e.g. cloned
    resistance genes) from weaker polygenic/QTL evidence.
    """
    __tablename__ = "associations"

    id = Column(Integer, primary_key=True, index=True)
    gene_symbol = Column(String, index=True)
    chromosome = Column(String, nullable=True)
    disease = Column(String, index=True)   # Early Blight / Late Blight / Fusarium Wilt
    association_type = Column(String)      # "resistance" or "susceptibility"
    evidence_level = Column(String)        # "strong (cloned gene)" / "moderate (QTL)" / "weak"
    source_citation = Column(Text)         # human-readable citation
    description = Column(Text, nullable=True)


class GeneCoordinate(Base):
    """
    Verified (or honestly-flagged-as-unverified) genomic coordinates for
    knowledge-base genes, used to match uploaded VCF variant positions to
    genes by range rather than by chromosome alone. Seeded from
    data/gene_coordinates_seed.json -- see that file's citations.
    """
    __tablename__ = "gene_coordinates"

    id = Column(Integer, primary_key=True, index=True)
    gene_symbol = Column(String, index=True)
    chromosome = Column(String, index=True)
    start = Column(Integer, nullable=True)
    end = Column(Integer, nullable=True)
    position_type = Column(String)   # approximate_window / gene_id_only.../ chromosome_level_only_HONEST_GAP
    source_citation = Column(Text)


class EnvironmentReading(Base):
    __tablename__ = "environment_readings"

    id = Column(Integer, primary_key=True, index=True)
    plant_id = Column(Integer, ForeignKey("plants.id"))
    temperature = Column(Float, nullable=True)
    humidity = Column(Float, nullable=True)
    soil_moisture = Column(Float, nullable=True)
    light = Column(Float, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    plant = relationship("Plant", back_populates="environment_readings")


class RiskScore(Base):
    __tablename__ = "risk_scores"

    id = Column(Integer, primary_key=True, index=True)
    plant_id = Column(Integer, ForeignKey("plants.id"))
    disease = Column(String)
    risk_level = Column(String)     # HIGH / MEDIUM / LOW
    risk_score = Column(Float)      # 0-100 evidence-weighted score, NOT a probability
    explanation_json = Column(Text) # JSON blob: contributing variants + env factors
    created_at = Column(DateTime, default=datetime.utcnow)

    plant = relationship("Plant", back_populates="risk_scores")
