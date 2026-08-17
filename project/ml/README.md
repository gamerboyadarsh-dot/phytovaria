# ML — Disease Risk Model

## What this actually is (read before your demo)
A trained RandomForest per disease that learned to approximate our own rule
engine (`backend/app/services/risk_engine.py`), because we do not have real
field-confirmed disease outcomes to train on in 6 days. This is disclosed
everywhere — in code comments, in `models/training_report.md`, and in every
API response under `ml_prediction.note`.

**Do not present the accuracy numbers as real-world predictive accuracy.**
The honest framing for judges: *"We built a complete, working ML pipeline —
feature engineering, train/test split, evaluation, explainability, and
serving — trained for now on rule-engine-derived labels since we lack field
data. It's one command away from retraining on real outcomes the moment we
have them."* That is a legitimate, judge-defensible answer.

## Already trained — models are in `models/`, nothing to run to demo

If you need to retrain from scratch (fresh machine):

```bash
cd ml
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python generate_training_data.py   # writes data/synthetic_training_data.csv
python train_model.py              # writes models/*.joblib + training_report.md
python predict.py                  # smoke test
```

## How it's wired into the backend
`backend/app/main.py` imports `ml/predict.py` directly (sibling folder) and,
if models exist and a full environmental reading is available, attaches an
`ml_prediction` block to every disease in the `/api/plants/{code}/risk`
response — alongside the rule engine's own score. If models aren't trained
yet, the endpoint still works fine with just the rule engine (`ml_prediction`
comes back `null`).

## Files
- `generate_training_data.py` — builds synthetic labeled data from the rule engine
- `train_model.py` — trains + evaluates + saves one model per disease
- `predict.py` — inference service, importable by the backend
- `models/training_report.md` — full metrics + the honesty framing, read this first
