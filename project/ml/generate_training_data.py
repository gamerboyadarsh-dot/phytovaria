"""
Generates training data for the ML risk model.

HONESTY NOTE (read this before touching anything else in ml/):
We do NOT have real field data linking actual tomato plants' genomes +
environments to CONFIRMED disease outcomes. Getting that would require
a season of field trials, which is impossible in 6 days. So we do the
scientifically honest thing instead of faking biological ground truth:

We sample random (genomic evidence, environment) combinations and label
them using the EXISTING rule engine from backend/app/services/risk_engine.py
(the one built on real cited gene-disease associations). The ML model
therefore learns to approximate our expert rule system -- it is a
"student model" of the rules, not an independently-validated predictor
of real-world disease.

Why bother building this at all, then? Three legitimate reasons:
1. It demonstrates a complete, working ML pipeline (train/test split,
   metrics, feature importance, model serialization) that is READY to be
   retrained the moment real labeled outcome data exists -- e.g. from a
   partner farm reporting confirmed diagnoses next season.
2. It gives you a second, independent-looking risk signal to show
   alongside the rule engine (useful for the "hybrid rule+ML" framing
   SIH judges respond well to) as long as you are upfront it's a
   student model of the rules, not of ground truth.
3. It's honest. If a judge asks "is this trained on real outcomes",
   the correct answer is "no, and here's exactly why, and here's our
   plan for real training data" -- which is a stronger answer than a
   fabricated accuracy number.
"""
import random
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))
from app.services.risk_engine import compute_disease_risk, EnvSnapshot, GenomicEvidence

DISEASES = ["Early Blight", "Late Blight", "Fusarium Wilt"]

# gene pools per disease, mirroring backend/data/knowledge_base_seed.json
DISEASE_GENES = {
    "Fusarium Wilt": [
        ("I-2", "resistance", "strong"),
        ("I-3", "resistance", "strong"),
    ],
    "Late Blight": [
        ("Ph-2", "resistance", "strong"),
        ("Ph-3", "resistance", "moderate"),
    ],
    "Early Blight": [
        ("EB_QTL_habrochaites", "resistance", "moderate"),
    ],
}


def random_env() -> EnvSnapshot:
    return EnvSnapshot(
        temperature=round(random.uniform(15, 38), 1),
        humidity=round(random.uniform(30, 98), 1),
        soil_moisture=round(random.uniform(10, 90), 1),
        light=round(random.uniform(100, 1200), 1),
    )


def random_genomic_evidence(disease: str) -> list:
    pool = DISEASE_GENES[disease]
    evidence = []
    for gene_symbol, assoc_type, level in pool:
        if random.random() < 0.5:  # 50% chance this plant carries this gene
            evidence.append(GenomicEvidence(gene_symbol, assoc_type, level, "seed_citation"))
    return evidence


def generate_dataset(n_samples: int = 3000, seed: int = 42):
    random.seed(seed)
    rows = []

    for _ in range(n_samples):
        env = random_env()
        for disease in DISEASES:
            evidence = random_genomic_evidence(disease)
            result = compute_disease_risk(disease, evidence, env)

            rows.append({
                "disease": disease,
                "resistance_gene_count": len(evidence),
                "temperature": env.temperature,
                "humidity": env.humidity,
                "soil_moisture": env.soil_moisture,
                "light": env.light,
                "risk_level": result.risk_level,
                "risk_score": result.risk_score,
            })

    return rows


if __name__ == "__main__":
    import csv

    rows = generate_dataset()
    out_path = os.path.join(os.path.dirname(__file__), "data", "synthetic_training_data.csv")
    with open(out_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)

    print(f"Generated {len(rows)} rows -> {out_path}")
    print("REMINDER: labels come from the rule engine, not real field outcomes. See module docstring.")
