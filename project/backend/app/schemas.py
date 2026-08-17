from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict
from datetime import datetime


class Token(BaseModel):
    access_token: str
    token_type: str


class UserCreate(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: EmailStr
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class PlantCreate(BaseModel):
    plant_code: str
    species: str = "Solanum lycopersicum"
    variety: Optional[str] = None
    sample_source: Optional[str] = None
    notes: Optional[str] = None


class PlantOut(PlantCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class EnvironmentIn(BaseModel):
    plant_id: str          # plant_code, matches ESP32 payload
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    soil_moisture: Optional[float] = None
    light: Optional[float] = None


class EnvironmentOut(BaseModel):
    id: int
    temperature: Optional[float]
    humidity: Optional[float]
    soil_moisture: Optional[float]
    light: Optional[float]
    timestamp: datetime

    class Config:
        from_attributes = True


class VariantOut(BaseModel):
    chromosome: str
    position: int
    ref_allele: str
    alt_allele: str
    gene_symbol: Optional[str]
    consequence: Optional[str]

    class Config:
        from_attributes = True


class MLRiskPrediction(BaseModel):
    predicted_risk_level: str
    confidence: float
    class_probabilities: dict
    most_influential_feature: str
    note: str


class DiseaseRisk(BaseModel):
    disease: str
    risk_level: str
    risk_score: float
    evidence_level: str
    contributing_variants: List[str]
    environmental_factors: List[str]
    explanation: str
    ml_prediction: Optional[MLRiskPrediction] = None


class RiskReport(BaseModel):
    plant_code: str
    generated_at: datetime
    disclaimer: str
    results: List[DiseaseRisk]
