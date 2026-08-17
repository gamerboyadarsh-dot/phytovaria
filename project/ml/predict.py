"""
Loads trained models and provides predictions with confidence + a plain
explanation of which features drove the prediction (via feature importance,
not a false claim of causal certainty).

Usage from backend:
    from ml.predict import predict_risk_ml
    result = predict_risk_ml("Fusarium Wilt", resistance_gene_count=2,
                              temperature=26, humidity=85, soil_moisture=55, light=600)
"""
import os
import joblib
import numpy as np
import pandas as pd

HERE = os.path.dirname(__file__)
MODELS_DIR = os.path.join(HERE, "models")
FEATURES = ["resistance_gene_count", "temperature", "humidity", "soil_moisture", "light"]

_model_cache = {}


def _load_model(disease: str):
    if disease not in _model_cache:
        path = os.path.join(MODELS_DIR, f"{disease.replace(' ', '_')}_model.joblib")
        if not os.path.exists(path):
            raise FileNotFoundError(
                f"No trained model for '{disease}' at {path}. Run train_model.py first."
            )
        _model_cache[disease] = joblib.load(path)
    return _model_cache[disease]


def predict_risk_ml(disease: str, resistance_gene_count: int, temperature: float,
                     humidity: float, soil_moisture: float, light: float) -> dict:
    model = _load_model(disease)
    X = pd.DataFrame([[resistance_gene_count, temperature, humidity, soil_moisture, light]],
                      columns=FEATURES)

    prediction = model.predict(X)[0]
    proba = model.predict_proba(X)[0]
    classes = model.classes_
    confidence = float(max(proba))

    importances = dict(zip(FEATURES, model.feature_importances_.round(3)))
    top_feature = max(importances, key=importances.get)

    return {
        "disease": disease,
        "predicted_risk_level": prediction,
        "confidence": round(confidence, 3),
        "class_probabilities": {c: round(float(p), 3) for c, p in zip(classes, proba)},
        "most_influential_feature": top_feature,
        "note": (
            "This is a student model of our rule engine, not an independently "
            "validated real-world predictor -- see ml/models/training_report.md"
        ),
    }


if __name__ == "__main__":
    # quick smoke test
    example = predict_risk_ml(
        "Fusarium Wilt",
        resistance_gene_count=2,
        temperature=26, humidity=85, soil_moisture=55, light=600,
    )
    import json
    print(json.dumps(example, indent=2))
