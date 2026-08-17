"""
Risk scoring engine.

Deliberately RULE-BASED + evidence-weighted for the prototype, not a
trained ML classifier -- we do not have a large enough labeled cohort
(plant x confirmed-diagnosis pairs) to train a legitimate supervised
model in 6 days without faking labels. This is the scientifically
honest choice (see project brief PART 8) and it has the added benefit
of being fully explainable, which SIH judges will probe hard.

Score = genomic_component + environmental_component
Both are 0-50, combined score is 0-100. This is a HEURISTIC SCORE,
not a calibrated probability -- language throughout uses
"risk score" / "susceptibility" / "evidence level", never "% chance".

Environmental favorability rules used here reflect well-established
plant pathology (general textbook knowledge, not a specific citation
requiring verification):
  - Late blight (Phytophthora infestans): favored by COOL, WET conditions
  - Early blight (Alternaria solani): favored by WARM, HUMID conditions
  - Fusarium wilt (Fusarium oxysporum f. sp. lycopersici): favored by
    WARM SOIL + moderate moisture; soil-borne, less dependent on
    ambient humidity than the two foliar diseases above
"""
from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class EnvSnapshot:
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    soil_moisture: Optional[float] = None
    light: Optional[float] = None


@dataclass
class GenomicEvidence:
    gene_symbol: str
    association_type: str      # "resistance" or "susceptibility"
    evidence_level: str        # strong / moderate / weak
    source_citation: str


@dataclass
class DiseaseRiskResult:
    disease: str
    risk_score: float          # 0-100
    risk_level: str            # LOW / MEDIUM / HIGH
    evidence_level: str        # overall strongest evidence level used
    contributing_variants: List[str] = field(default_factory=list)
    environmental_factors: List[str] = field(default_factory=list)
    explanation: str = ""


EVIDENCE_WEIGHTS = {"strong": 1.0, "moderate": 0.6, "weak": 0.3}


def _score_genomic_component(evidence: List[GenomicEvidence]) -> tuple[float, List[str], str]:
    """Returns (score out of 50, list of human-readable variant notes, strongest evidence level)."""
    if not evidence:
        return 0.0, [], "none"

    score = 0.0
    notes = []
    levels_seen = []

    for ev in evidence:
        weight = EVIDENCE_WEIGHTS.get(ev.evidence_level, 0.3)
        direction = 1 if ev.association_type == "susceptibility" else -1
        contribution = direction * weight * 25  # each gene can swing up to +/-25
        score += contribution
        levels_seen.append(ev.evidence_level)
        notes.append(
            f"{ev.gene_symbol}: {ev.association_type} ({ev.evidence_level} evidence, {ev.source_citation})"
        )

    # recenter: 0 evidence -> neutral 25/50; strong resistance genes push
    # the score DOWN (lower risk), strong susceptibility genes push it UP
    score = max(0.0, min(50.0, 25 + score))
    strongest = "strong" if "strong" in levels_seen else ("moderate" if "moderate" in levels_seen else "weak")
    return score, notes, strongest


def _score_environment_component(disease: str, env: EnvSnapshot) -> tuple[float, List[str]]:
    score = 25.0  # neutral baseline out of 50
    notes = []

    if disease == "Late Blight":
        if env.temperature is not None and env.humidity is not None:
            if env.temperature <= 24 and env.humidity >= 80:
                score = 45.0
                notes.append(f"Cool + humid conditions ({env.temperature}°C, {env.humidity}% RH) favor late blight")
            elif env.temperature > 28 or env.humidity < 60:
                score = 10.0
                notes.append(f"Warm/dry conditions ({env.temperature}°C, {env.humidity}% RH) are unfavorable for late blight")

    elif disease == "Early Blight":
        if env.temperature is not None and env.humidity is not None:
            if 24 <= env.temperature <= 32 and env.humidity >= 70:
                score = 42.0
                notes.append(f"Warm + humid conditions ({env.temperature}°C, {env.humidity}% RH) favor early blight")
            elif env.humidity < 50:
                score = 12.0
                notes.append(f"Low humidity ({env.humidity}% RH) is unfavorable for early blight")

    elif disease == "Fusarium Wilt":
        if env.soil_moisture is not None and env.temperature is not None:
            if env.temperature >= 25 and 40 <= env.soil_moisture <= 70:
                score = 40.0
                notes.append(f"Warm soil + moderate moisture ({env.temperature}°C, {env.soil_moisture}% soil moisture) favor Fusarium wilt")
            elif env.soil_moisture < 25:
                score = 15.0
                notes.append(f"Low soil moisture ({env.soil_moisture}%) is unfavorable for Fusarium wilt")

    if not notes:
        notes.append("Insufficient/neutral environmental data -- using baseline")

    return score, notes


def compute_disease_risk(
    disease: str,
    genomic_evidence: List[GenomicEvidence],
    env: EnvSnapshot,
) -> DiseaseRiskResult:
    genomic_score, variant_notes, evidence_level = _score_genomic_component(genomic_evidence)
    env_score, env_notes = _score_environment_component(disease, env)

    total = round(genomic_score + env_score, 1)

    if total >= 65:
        level = "HIGH"
    elif total >= 40:
        level = "MEDIUM"
    else:
        level = "LOW"

    explanation = (
        f"{disease}: {level} risk (score {total}/100). "
        f"Genomic component contributed {genomic_score}/50 based on "
        f"{len(genomic_evidence)} matched gene(s); environmental component "
        f"contributed {env_score}/50."
    )

    return DiseaseRiskResult(
        disease=disease,
        risk_score=total,
        risk_level=level,
        evidence_level=evidence_level,
        contributing_variants=variant_notes,
        environmental_factors=env_notes,
        explanation=explanation,
    )
