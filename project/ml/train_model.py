"""
Trains one RandomForestClassifier per disease on the synthetic (rule-derived)
dataset. Run generate_training_data.py first.

Outputs:
  - ml/models/{disease}_model.joblib
  - ml/models/training_report.md   <- honest metrics + what they mean
"""
import os
import json
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import joblib

FEATURES = ["resistance_gene_count", "temperature", "humidity", "soil_moisture", "light"]
DISEASES = ["Early Blight", "Late Blight", "Fusarium Wilt"]

HERE = os.path.dirname(__file__)
DATA_PATH = os.path.join(HERE, "data", "synthetic_training_data.csv")
MODELS_DIR = os.path.join(HERE, "models")


def train_one_disease(df: pd.DataFrame, disease: str, report_lines: list):
    subset = df[df["disease"] == disease]
    X = subset[FEATURES]
    y = subset["risk_level"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y
    )

    model = RandomForestClassifier(n_estimators=150, max_depth=6, random_state=42)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)

    importances = dict(zip(FEATURES, model.feature_importances_.round(3)))

    report_lines.append(f"\n## {disease}\n")
    report_lines.append(f"- Train samples: {len(X_train)}, Test samples: {len(X_test)}")
    report_lines.append(f"- Test accuracy vs. rule-engine labels: **{acc:.3f}**")
    report_lines.append(f"- Feature importances: {importances}")
    report_lines.append("```\n" + classification_report(y_test, y_pred) + "\n```")

    model_path = os.path.join(MODELS_DIR, f"{disease.replace(' ', '_')}_model.joblib")
    joblib.dump(model, model_path)
    return acc


def main():
    os.makedirs(MODELS_DIR, exist_ok=True)
    df = pd.read_csv(DATA_PATH)

    report_lines = [
        "# ML Training Report\n",
        "**Read this before quoting any number below to judges.**\n",
        "These models are trained on synthetic data where labels come from "
        "our own rule engine (`backend/app/services/risk_engine.py`), NOT "
        "from real confirmed plant disease outcomes. High accuracy here means "
        "'the model successfully learned to approximate our rules' -- it does "
        "NOT mean 'this model accurately predicts real-world tomato disease'. "
        "We do not have field-validated labels to make that second claim, and "
        "we say so explicitly rather than implying it.\n",
        "The value of this pipeline: it is fully wired (feature extraction, "
        "train/test split, evaluation, serialization, inference) and ready "
        "to be retrained the moment real labeled outcomes are available -- "
        "e.g. from a partner farm's confirmed diagnoses next season.\n",
    ]

    accuracies = {}
    for disease in DISEASES:
        accuracies[disease] = train_one_disease(df, disease, report_lines)

    report_path = os.path.join(MODELS_DIR, "training_report.md")
    with open(report_path, "w") as f:
        f.write("\n".join(report_lines))

    print("Training complete.")
    for d, a in accuracies.items():
        print(f"  {d}: test accuracy {a:.3f} (vs. rule-engine labels, see honesty note in report)")
    print(f"\nFull report: {report_path}")


if __name__ == "__main__":
    main()
