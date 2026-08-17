# Backend — Genomic Plant Health Platform

## What this is
FastAPI backend implementing: plant registration, VCF upload/parsing, environmental
sensor ingestion, and an explainable rule-based disease-risk engine, backed by a
literature-cited knowledge base (see `data/knowledge_base_seed.json`).

Tested end-to-end on this machine — register → upload VCF → post sensor reading →
get risk report all return 200 OK.

## Run it (fresh machine)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
pip install scikit-learn pandas numpy joblib   # needed for the ML hybrid signal, see ../ml/README.md
uvicorn app.main:app --reload --port 8000
```

Open http://localhost:8000/docs for interactive Swagger UI — use this to demo live
without needing the frontend if anything breaks.

## Test flow (curl)

```bash
curl -X POST http://localhost:8000/api/plants -H "Content-Type: application/json" \
  -d '{"plant_code":"TOMATO-001","variety":"Heinz 1706"}'

curl -X POST http://localhost:8000/api/plants/TOMATO-001/upload-vcf \
  -F "file=@data/demo_sample.vcf"

curl -X POST http://localhost:8000/api/sensor-data -H "Content-Type: application/json" \
  -d '{"plant_id":"TOMATO-001","temperature":26,"humidity":85,"soil_moisture":55,"light":600}'

curl http://localhost:8000/api/plants/TOMATO-001/risk
```

## IMPORTANT — honesty notes for judges / your own understanding

1. **`data/demo_sample.vcf` is SYNTHETIC** (positions made up to land on the right
   chromosomes for a demo). For the real submission, download an actual accession
   VCF from `ftp://ftp.solgenomics.net/genomes/tomato100/` and use that instead —
   the parser (`app/services/vcf_parser.py`) handles real VCFv4.x files.
2. **Gene matching is currently CHROMOSOME-level, not exact-position-level.**
   `data/gene_coordinates_TODO.json` documents exactly what's needed to upgrade to
   real position-range matching (real coordinates from the ITAG4.1 GFF3 annotation
   file on SolGenomics). Chromosome-level matching is an honest, disclosed
   simplification — don't claim SNP-level precision to judges unless this is filled in.
3. **The knowledge base associations are real, cited genes** (I-2, I-3, Ph-2, Ph-3,
   early blight QTLs) — see citations in `knowledge_base_seed.json`. Don't add new
   disease/gene associations without a real citation.
4. **Risk scores are heuristic, not probabilities.** The engine is rule-based and
   fully explainable by design (see docstring in `risk_engine.py`) because we don't
   have a labeled training set to legitimately train an ML classifier in 6 days.
   This is a defensible, honest design choice — say so proactively in your pitch.

## Endpoints
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/plants` | Register a plant |
| GET | `/api/plants` | List all plants |
| GET | `/api/plants/{code}` | Get one plant |
| POST | `/api/plants/{code}/upload-vcf` | Upload + parse a VCF file |
| GET | `/api/plants/{code}/variants` | List parsed variants |
| POST | `/api/sensor-data` | ESP32 posts readings here |
| GET | `/api/plants/{code}/environment/latest` | Latest sensor reading |
| GET | `/api/plants/{code}/risk` | Full explainable risk report (rule engine + ML, when available) |

## ML integration
`/api/plants/{code}/risk` also returns an `ml_prediction` field per disease if
`../ml/models/*.joblib` exist and a full sensor reading is present. See
`../ml/README.md` for what that model actually is and how to talk about it
honestly to judges. To enable it: `pip install scikit-learn pandas numpy joblib`
in this backend's venv too (already in the zip's trained models — just need
the runtime libraries installed).
