# PhytoVaria — Genomic Plant Intelligence Platform
### Smart India Hackathon 2024 — Genomics Track

PhytoVaria is a **genomic variation interpretation and disease-susceptibility risk assessment platform** for *Solanum lycopersicum* (tomato). It ingests VCF data, annotates variants against a curated knowledge base, combines genomic evidence with live environmental sensor data, and generates an explainable disease risk assessment.

---

## Quick Start — Local Development

### Prerequisites
- Python 3.10+ (`python --version`)
- Node.js 18+ (`node --version`)
- Git

### 1. Clone and enter
```bash
git clone https://github.com/gamerboyadarsh-dot/phytovaria.git
cd phytovaria
```

### 2. Backend
```bash
cd project/backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt

# Copy env config
copy .env.example .env   # Windows
# cp .env.example .env   # macOS/Linux

# Start server
uvicorn app.main:app --reload --port 8000
```

Backend will be live at: http://localhost:8000  
Swagger docs: http://localhost:8000/docs

### 3. Frontend
```bash
cd frontend
copy .env.example .env   # Windows
npm install
npm run dev
```

Frontend will be live at: http://localhost:5173

---

## Demo Mode (No Hardware Required)

1. Start the backend
2. Start the frontend
3. In the frontend — Environment page → toggle **Demo Mode**
4. For the complete demo flow, use: `backend/data/demo_sample.vcf`

### Full Demo Flow
1. Open http://localhost:5173
2. Click **Register Plant** → Plant ID: `TOMATO-001`, Variety: `Heinz 1706`
3. Plant profile opens → click **Upload VCF**
4. Upload `project/backend/data/demo_sample.vcf`
5. Click **View Risk Assessment** → see scores
6. Click **Explain** → see genomic + environmental evidence
7. Go to **Environment** page → toggle Demo Mode
8. Click **Full Report** → Print/Export

---

## IoT — ESP32 Setup

See [`iot/README.md`](iot/README.md) for complete hardware setup.

**Quick summary:**
1. Wire DHT22 DATA pin to ESP32 GPIO4 with 10kΩ pull-up
2. Open `iot/esp32_firmware/config.h` and set WiFi credentials + backend URL
3. Flash `phytovaria_sensor.ino` via Arduino IDE
4. ESP32 will post to `POST /api/sensor-data` every 30 seconds

---

## Project Structure

```
phytovaria/
├── backend/          ← Legacy (preserved)
├── project/
│   ├── backend/      ← CANONICAL backend (use this)
│   │   ├── app/
│   │   │   ├── main.py          ← FastAPI routes
│   │   │   ├── models.py        ← SQLAlchemy ORM
│   │   │   ├── schemas.py       ← Pydantic schemas
│   │   │   ├── database.py      ← SQLite engine
│   │   │   └── services/
│   │   │       ├── vcf_parser.py
│   │   │       └── risk_engine.py
│   │   └── data/
│   │       ├── knowledge_base_seed.json
│   │       ├── gene_coordinates_seed.json
│   │       └── demo_sample.vcf
│   └── ml/           ← Random Forest pipeline
│       ├── train_model.py
│       ├── predict.py
│       └── models/   ← Trained .joblib files
│
├── frontend/         ← React + Vite dashboard
│   └── src/
│       ├── App.tsx
│       ├── pages/    ← 10 pages
│       ├── components/
│       └── lib/api.ts ← API client
│
├── iot/              ← ESP32 firmware
│   ├── esp32_firmware/
│   │   ├── phytovaria_sensor.ino
│   │   └── config.h
│   ├── wiring_diagram.md
│   └── README.md
│
└── README.md
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/plants` | Register plant |
| GET | `/api/plants` | List plants |
| GET | `/api/plants/{code}` | Get plant |
| POST | `/api/plants/{code}/upload-vcf` | Upload VCF |
| GET | `/api/plants/{code}/variants` | Get variants |
| POST | `/api/sensor-data` | ESP32 sensor post |
| GET | `/api/plants/{code}/environment/latest` | Latest env reading |
| GET | `/api/plants/{code}/environment/history` | Env history |
| GET | `/api/plants/{code}/risk` | Risk assessment |
| GET | `/api/plants/{code}/report` | Full report |
| GET | `/api/demo/sensor` | Demo sensor data |
| GET | `/api/stats` | Dashboard stats |

---

## Deployment

### Backend (Render)
1. Create new **Web Service** on Render
2. Connect GitHub repo
3. Root directory: `project/backend`
4. Build command: `pip install -r requirements.txt`
5. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Environment variables: see `.env.example`

### Frontend (Vercel)
1. Create new project on Vercel
2. Root directory: `frontend`
3. Framework: Vite
4. Build command: `npm run build`
5. Output directory: `dist`
6. Environment variable: `VITE_API_URL=https://your-render-backend.onrender.com`

---

## Scientific Honesty

> PhytoVaria is a genomic variation **interpretation** platform, not a sequencing system.

- We use existing public/user-supplied VCF data
- Gene-disease associations are sourced from published literature (citations in `knowledge_base_seed.json`)
- Risk scores are evidence-weighted heuristics (0–100), NOT calibrated clinical probabilities
- The Random Forest pipeline was trained on synthetic demonstration data
- Unknown variants are labeled "Unknown / Insufficient Evidence" — never assigned pathogenicity
- Hardware is minimal (ESP32 + DHT22) and provides environmental context only

---

## Team

| Member | Role |
|--------|------|
| 1 (Lead) | Architecture, Integration, Demo |
| 2 | FastAPI Backend |
| 3 | Bioinformatics / VCF / Knowledge Base |
| 4 | AI/ML / Risk Engine |
| 5 | IoT (ESP32 + DHT22) |
| 6 | Frontend / Dashboard |
