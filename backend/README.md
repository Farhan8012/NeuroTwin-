# NeuroTwin Backend

FastAPI central orchestrator powering ambient cognitive memory assistance, biometrics, multi-modal perception, and real-time cloud database synchronization.

---

## 🏛️ Technology Stack

- **FastAPI** (Python 3.12 via `uv`) — async high-throughput REST orchestrator on port `8000`.
- **Groq Cloud LLM** (`openai/gpt-oss-120b`) — ultra-fast (~0.5s) empathetic reasoning and cognitive persona grounding.
- **Groq Whisper Cloud** (`whisper-large-v3`) — high-accuracy speech-to-text audio transcription.
- **InsightFace `buffalo_l`** — 512-dimensional ArcFace facial biometric embedding extractor.
- **Qdrant Vector Database (Cloud & Local)** — Cosine vector search collections for `people` (512-d) and `objects` (128-d).
- **Supabase Cloud Database** — Write-through mirror for `memories`, `medicines`, `people`, and `emergency_contacts`.
- **Piper Neural TTS** (`en_US-lessac-medium`) — ONNX speech synthesis engine generating natural speech responses.

---

## 📂 Directory Layout

```
backend/
├── app/
│   ├── main.py              # FastAPI app, static mounts (/app, /static, /dashboard), lifespan init
│   ├── config.py            # Pydantic settings & environment loader
│   ├── schemas.py           # Pydantic request/response schemas
│   ├── auth.py              # Caregiver API key middleware
│   ├── services/
│   │   ├── llm_service.py       # Groq / Ollama persona generation + Supabase memory ingestion
│   │   ├── face_service.py      # InsightFace buffalo_l 512-d face vector extraction
│   │   ├── qdrant_service.py    # Qdrant Cloud vector search, collections, and upserts
│   │   ├── stt_service.py       # Groq Whisper Cloud & local faster-whisper STT
│   │   ├── tts_service.py       # Piper ONNX neural speech synthesis
│   │   ├── context_cache.py     # In-memory TTL multi-modal visual context cache
│   │   ├── supabase_sync.py     # Real-time write-through mirror to Supabase Postgres
│   │   ├── people_store.py      # Person profile and biometric registry
│   │   └── json_store.py        # Generic JSON-backed store with Supabase sync
│   └── routers/
│       ├── health.py            # GET /api/v1/health (Qdrant Cloud, Groq, memory metrics)
│       ├── frame.py             # POST /api/v1/frame (InsightFace + YOLO + context_cache)
│       ├── voice.py             # POST /api/v1/voice-query (JSON) & /audio (Multipart STT)
│       ├── people.py            # /api/v1/people CRUD + photo→vector indexing
│       ├── memories.py          # /api/v1/memories CRUD + Supabase write-through
│       ├── medicines.py         # /api/v1/medicines CRUD + Supabase write-through
│       ├── emergency.py         # /api/v1/emergency-contacts CRUD
│       ├── objects.py           # /api/v1/objects list + location tracking
│       ├── ble.py               # /api/v1/ble beacon tracking & RSSI logging
│       ├── albums.py            # /api/v1/albums photo album management
│       └── metrics.py           # /metrics Prometheus telemetry endpoint
├── models/                      # Bundled ONNX models (InsightFace, Piper voice)
├── static/                      # Generated TTS audio .wav files and uploaded photos
├── data/                        # Local persistent JSON storage
└── requirements.txt             # Python dependencies
```

---

## 🚀 Running the Backend

```bash
cd backend

# 1. Activate virtual environment
source .venv/bin/activate

# 2. Run with uvicorn on all network interfaces
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 📡 API Endpoints (all under `/api/v1`)

| Method | Path | Purpose |
| :--- | :--- | :--- |
| **GET** | `/health` | Live telemetry (Groq, Qdrant Cloud, Supabase sync, CPU/RAM metrics) |
| **POST** | `/frame` | Streams camera frame → InsightFace match + YOLO → updates `context_cache` |
| **POST** | `/voice-query` | JSON text query → live camera context → Groq LLM → Piper TTS audio |
| **POST** | `/voice-query/audio` | Multipart audio → Whisper STT → Groq LLM → Piper TTS audio |
| **GET/POST** | `/people` | List or create registered family & contacts |
| **POST** | `/people/with-photo` | Multipart photo upload → 512-d ArcFace vector indexed in Qdrant Cloud |
| **GET/PUT/DELETE** | `/people/{id}` | Retrieve, edit, or purge a profile and its Qdrant vectors |
| **GET/POST/DELETE** | `/memories` | Life memories & stored notes CRUD (mirrored to Supabase) |
| **GET/POST/DELETE** | `/medicines` | Medication schedule CRUD (mirrored to Supabase) |
| **GET/POST/DELETE** | `/emergency-contacts`| Emergency SOS contacts CRUD (mirrored to Supabase) |
| **GET** | `/objects` | List tracked personal belongings from Qdrant |
| **GET** | `/metrics` | Prometheus telemetry endpoint |

---

## 🧠 Conversational Memory Saving
The backend automatically analyzes voice queries for memory ingestion intents (e.g. *"Remember that my blue glasses are on the bedside nightstand"*). When detected, `llm_service.py` extracts the structured memory payload and writes it directly to the Supabase Cloud Postgres `memories` table via `supabase_sync.py`.