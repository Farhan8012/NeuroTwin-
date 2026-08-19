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
│   ├── main.py            # FastAPI app, CORS, static mounts, lifespan init
│   ├── config.py          # Pydantic settings + model/storage paths
│   ├── schemas.py         # Pydantic request/response models
│   ├── services/
│   │   ├── qdrant_service.py   # people/objects collections, upsert, cosine search
│   │   ├── face_service.py     # InsightFace embedding extraction
│   │   ├── stt_service.py      # faster-whisper transcription
│   │   ├── llm_service.py      # Ollama/Groq persona generation
│   │   ├── tts_service.py      # Piper WAV synthesis
│   │   ├── people_store.py     # JSON-backed profile registry
│   │   └── context_cache.py    # in-memory visual-context TTL cache
│   └── routers/
│       ├── health.py      # GET /api/v1/health (real telemetry)
│       ├── frame.py       # POST /api/v1/frame (face match)
│       ├── voice.py       # POST /api/v1/voice-query (STT → LLM → TTS)
│       └── people.py      # /api/v1/people CRUD + photo→vector indexing
├── qdrant/                # native Qdrant binary + storage
├── models/                # bundled model weights (auto-downloaded on first use)
├── static/                # served audio/photos
├── data/                  # people.json profile registry
└── requirements.txt
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

## API (all under `/api/v1`)

| Method | Path | Purpose |
| :--- | :--- | :--- |
| GET | `/health` | Real Qdrant/Ollama/system telemetry |
| POST | `/frame` | Upload gated frame → face match → person context |
| POST | `/voice-query` | JSON text OR multipart `audio` → STT → LLM → TTS |
| GET/POST | `/people` | List / register profiles (JSON) |
| POST | `/people/with-photo` | Multipart photo upload → 512-d vector index |
| GET/PUT/DELETE | `/people/{id}` | Fetch, update, or purge a profile + vectors |

## Thresholds

Face match uses cosine similarity with `FACE_MATCH_THRESHOLD = 0.50` (tunable via
`.env`). Reference quality photos score ~0.9+; low-resolution gated frames score
lower while remaining well-separated from impostors.