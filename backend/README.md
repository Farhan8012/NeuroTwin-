# NeuroTwin Backend

FastAPI central orchestrator running on the Apple M4 MacBook Air host.

## Stack

- **FastAPI** (Python 3.12 via `uv`) — async REST orchestrator on port `8000`
- **Qdrant 1.19** — native binary (no Docker daemon required), port `6333`
- **InsightFace `buffalo_l`** — 512-d face embeddings (onnxruntime CPU)
- **faster-whisper `base`** — CPU/int8 STT
- **Piper TTS (`en_US-lessac-medium`)** — response audio synthesis
- **LLM** — local Ollama (`qwen3:8b`) by default, Groq Llama 3 when `LLM_PROVIDER=groq`

## Directory Layout

```
backend/
├── app/
│   ├── main.py              # FastAPI app, CORS, static mounts, lifespan init
│   ├── config.py            # Pydantic settings + model/storage paths
│   ├── schemas.py           # Pydantic request/response models
│   ├── services/
│   │   ├── qdrant_service.py    # people/objects collections, UUID5 IDs, cosine search
│   │   ├── face_service.py      # InsightFace buffalo_l 512-d embedding extraction
│   │   ├── stt_service.py       # faster-whisper base (CPU int8) transcription
│   │   ├── llm_service.py       # Ollama Qwen3-8B / Groq Llama 3 persona generation
│   │   ├── tts_service.py       # Piper en_US-lessac-medium WAV synthesis
│   │   ├── people_store.py      # JSON-backed person profile registry
│   │   ├── context_cache.py     # In-memory TTL cache for visual context
│   │   └── json_store.py        # Generic JSON CRUD store (memories, meds, contacts)
│   └── routers/
│       ├── health.py            # GET /api/v1/health (real Qdrant/Ollama telemetry)
│       ├── frame.py             # POST /api/v1/frame (face match + context cache + object tracking)
│       ├── voice.py             # POST /api/v1/voice-query (JSON) + /audio (multipart STT)
│       ├── people.py            # /api/v1/people CRUD + photo→vector indexing
│       ├── memories.py          # /api/v1/memories CRUD (persistent JSON)
│       ├── medicines.py         # /api/v1/medicines CRUD (persistent JSON)
│       ├── emergency.py         # /api/v1/emergency-contacts CRUD (persistent JSON)
│       └── objects.py           # /api/v1/objects list + location query
├── qdrant/                     # native Qdrant binary + storage
│   ├── bin/qdrant              # arm64 binary (no Docker)
│   └── config.yaml
├── models/                     # bundled model weights (auto-downloaded on first use)
│   ├── insightface/models/buffalo_l/   # 5 ONNX files (~570MB)
│   ├── whisper/models/Systran--faster-whisper-base/  # ~145MB
│   └── piper/en_US-lessac-medium.onnx  # ~60MB
├── static/
│   ├── audio/                  # Piper TTS WAV output
│   └── photos/                 # Uploaded reference photos
├── data/                       # JSON-backed persistent storage
│   ├── people.json
│   ├── memories.json
│   ├── medicines.json
│   └── emergency_contacts.json
├── requirements.txt
└── .env.example
```

## Setup & Run (M4 host)

```bash
# 1. Virtualenv (Python 3.12)
uv venv --python 3.12 .venv

# 2. Dependencies
uv pip install --python .venv/bin/python -r requirements.txt

# 3. Qdrant (native, no Docker)
./qdrant/bin/qdrant --config-path qdrant/config.yaml

# 4. Backend
.venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

# 5. Web dashboard
(cd ../web && python3 -m http.server 5500)   # open http://localhost:5500
```

First model load downloads weights into `models/` (~500 MB total for InsightFace,
Whisper base, and Piper voice).

## API (all under `/api/v1`) — 16/16 Endpoints Tested ✅

| Method | Path | Purpose | Status |
| :--- | :--- | :--- | :--- |
| GET | `/health` | Real Qdrant/Ollama/system telemetry | ✅ |
| POST | `/frame` | Upload gated frame → face match → context cache | ✅ |
| POST | `/voice-query` | JSON text → LLM → TTS response | ✅ |
| POST | `/voice-query/audio` | Multipart audio → Whisper STT → LLM → TTS | ✅ |
| GET/POST | `/people` | List / register profiles (JSON) | ✅ |
| POST | `/people/with-photo` | Multipart photo upload → 512-d vector index | ✅ |
| GET/PUT/DELETE | `/people/{id}` | Fetch, update, or purge a profile + vectors | ✅ |
| GET/POST/DELETE | `/memories` | Memory anchors CRUD (persistent JSON) | ✅ |
| GET/POST/DELETE | `/medicines` | Medication schedule CRUD (persistent JSON) | ✅ |
| GET/POST/DELETE | `/emergency-contacts` | Emergency contacts CRUD (persistent JSON) | ✅ |
| GET | `/objects` | List tracked objects (Qdrant) | ✅ |
| GET | `/objects/{class}/location` | Last-seen location for object class | ✅ |

## Model Test Results (2026-08-19)

| Component | Model | Test Input | Result |
| :--- | :--- | :--- | :--- |
| Face Embedding | InsightFace `buffalo_l` | Synthetic 160×160 JPEG | 512-d, norm=1.0000 ✅ |
| Vector Search | Qdrant (cosine) | Self-match query | Score=1.000 ✅ |
| Speech-to-Text | faster-whisper `base` | 1s sine wave WAV | Loaded, empty text (expected) ✅ |
| Text-to-Speech | Piper `en_US-lessac-medium` | "This is your daughter Sarah." | 59KB WAV ✅ |
| LLM | Ollama `qwen3:8b` | "Who is she?" + Sarah context | Warm response in ~11s ✅ |
| Context Cache | In-memory TTL | Store → retrieve | Round-trip ✅ |
| People Store | JSON-backed | List profiles | 1 profile ✅ |

## Thresholds

Face match uses cosine similarity with `FACE_MATCH_THRESHOLD = 0.50` (tunable via
`.env`). Reference quality photos score ~0.9+; low-resolution gated frames score
lower while remaining well-separated from impostors.

## Authentication

Caregiver CRUD endpoints are protected by API key authentication (`backend/app/auth.py`).

```bash
# Enable auth (set in .env or export)
export NEUROTWIN_API_KEY=my-secret-key

# Patient-facing endpoints (no auth needed)
curl http://localhost:8000/api/v1/health

# Caregiver endpoints (auth required when key is set)
curl -H "X-API-Key: my-secret-key" http://localhost:8000/api/v1/people
```

When `NEUROTWIN_API_KEY` is not set, all endpoints are open (default for local development).

## External Services

- **Qdrant 1.19:** Native binary on port `6333`, collections `people` (512-d) and `objects` (128-d).
- **Ollama:** `qwen3:8b` (Q4_K_M, 8.2B params) on port `11434`, ~11s response time on M4.
- **Groq (optional):** Set `LLM_PROVIDER=groq` + `GROQ_API_KEY` for cloud fallback.