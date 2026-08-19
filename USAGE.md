# NeuroTwin — Usage Guide

Everything you need to set up, run, and use the NeuroTwin cognitive companion system.

---

## Prerequisites

| Component | Requirement |
|-----------|-------------|
| **OS** | macOS (Apple Silicon M4 recommended) or Linux |
| **Python** | 3.12+ (via `uv` or system Python) |
| **Qdrant** | Native binary included at `backend/qdrant/bin/qdrant` |
| **Ollama** | Running locally with `qwen3:8b` model pulled |
| **Node/HTTP server** | Python 3 built-in `http.server` works for the web dashboard |

---

## 1. First-Time Setup

### Clone & enter the project
```bash
cd /path/to/Neuro_Twin
```

### Python virtual environment
```bash
cd backend
uv venv --python 3.12 .venv
uv pip install --python .venv/bin/python -r requirements.txt
```

### Configuration
```bash
cp .env.example .env
# Edit .env if you want to change defaults (optional for local dev)
```

Key `.env` variables:
```bash
LLM_PROVIDER=ollama          # "ollama" (default) or "groq"
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen3:8b
QDRANT_HOST=localhost
QDRANT_PORT=6333
FACE_MATCH_THRESHOLD=0.50
WHISPER_MODEL=base
NEUROTWIN_API_KEY=            # Leave blank to disable auth in dev
```

### Pull the Ollama model (if not already pulled)
```bash
ollama pull qwen3:8b
```

### Verify Ollama is running
```bash
curl http://localhost:11434/api/tags
# Should show qwen3:8b in the models list
```

### Seed the database with sample data
```bash
cd backend
.venv/bin/python seed.py
```

This populates:
- 3 sample people (Sarah Varma, Dr. Thorne, Robert Lowe) with face vectors in Qdrant
- 5 memory anchors (life events, songs, stories)
- 4 medications (Donepezil, Memantine, Vitamin D3, Melatonin)
- 3 emergency contacts

Safe to run multiple times — skips existing data.

---

## 2. Starting the System

### Option A: One-Command Startup (Recommended)

```bash
# Start all 3 services with one command
./start.sh

# Other commands:
./start.sh --status    # Check what's running
./start.sh --stop      # Stop everything
./start.sh --docker    # Use Docker Compose instead
```

This starts Qdrant, FastAPI, and the web dashboard automatically with health checks.

### Option B: Docker Compose

```bash
docker compose up --build
```

This runs Qdrant + FastAPI in containers. Ollama runs on the host machine and is accessed via `host.docker.internal`. The web dashboard still needs to be served separately:

```bash
cd web && python3 -m http.server 5500
```

### Option C: Manual (3 terminals)

**Terminal 1 — Qdrant:**
```bash
cd backend
./qdrant/bin/qdrant --config-path qdrant/config.yaml
```

**Terminal 2 — FastAPI:**
```bash
cd backend
.venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**Terminal 3 — Web Dashboard:**
```bash
cd web
python3 -m http.server 5500
```

### Verify everything is running
```bash
# Check all services
./start.sh --status

# Backend health check
curl http://localhost:8000/api/v1/health

# Open web dashboard
open http://localhost:5500
```

---

## 3. Accessing the UI

Open your browser and go to:

| URL | What it is |
|-----|-----------|
| **http://localhost:5500** | Web dashboard (Patient + Caregiver modes) |
| **http://localhost:8000/docs** | FastAPI Swagger API documentation |
| **http://localhost:8000** | Backend root (health check) |

---

## 4. Using the Web Dashboard

### Patient Mode (default view)
The large-type interface designed for elderly patients:

1. **Recognition Card** — Shows the currently detected person with their relationship, name, and a warm summary of recent interactions.

2. **🎙️ Tap to Ask a Question** — Big white button. Click it to send a voice query to the backend. The LLM generates a warm companion response, and a Piper TTS audio file is created. Click "Play Audio Answer" to hear it.

3. **🎵 Play Sarah's Song** — Plays a comforting song through the earpiece.

4. **📞 Call Daughter Sarah** — Initiates a phone call to the registered contact.

5. **Memory Cards** — Reassuring stories and memories about the recognized person.

### Caregiver Mode
Click **⚙️ Caregiver Mode** in the top-right to switch. This reveals 5 tabs:

#### 👥 People Tab
- View all registered people with their ID, name, relationship, birthday, vector status, and key memory.
- **+ Add New Person** — Opens a modal to register a new person:
  - Fill in name, relationship, birthday, initial memory
  - Upload a reference photo ( InsightFace extracts a 512-d face vector and indexes it into Qdrant)
  - Click "Save & Index Face Vector"
- **Delete** — Removes the person profile AND their face vectors from Qdrant (right to be forgotten).

#### 🧠 Memories Tab
- View all memory anchors (life events, anecdotes, songs, places, hobbies).
- **+ Add Memory** — Opens a modal:
  - Title, description, category (story/life_event/song/place/hobby/anecdote)
  - Optional person binding
- **Delete** — Removes the memory from persistent storage.

#### 💊 Medicines Tab
- View the medication schedule (pre-seeded with Donepezil and Memantine).
- **+ Add Medicine** — Opens a modal:
  - Medicine name, dosage, schedule time, instructions
- **Delete** — Removes the medication.

#### 🚨 Emergency Tab
- View emergency contacts (pre-seeded with Sarah Varma and Dr. Thorne).
- **+ Add Contact** — Opens a modal:
  - Name, relationship, phone number, is-primary toggle
- **Delete** — Removes the contact.

#### 📊 Telemetry Tab
- Live system metrics from the M4 backend:
  - FastAPI status, Qdrant connection, Ollama LLM, Whisper STT, Piper TTS
  - CPU usage, memory usage
  - Indexed people count, indexed objects count
- **Patient Voice Query Log** — Running history of all voice queries and responses.
- **↻ Refresh** — Re-fetches telemetry data.

---

## 5. Using the API Directly

All endpoints are under `http://localhost:8000/api/v1`.

### Patient-Facing (no auth needed)

```bash
# Health check
curl http://localhost:8000/api/v1/health

# Upload a camera frame for face recognition
curl -X POST http://localhost:8000/api/v1/frame \
  -F "file=@photo_of_person.jpg"

# Send a text voice query
curl -X POST http://localhost:8000/api/v1/voice-query \
  -H "Content-Type: application/json" \
  -d '{"patient_query": "Who is she?"}'

# Send an audio file for STT → LLM → TTS
curl -X POST http://localhost:8000/api/v1/voice-query/audio \
  -F "audio=@recording.wav"
```

### Caregiver CRUD (auth required if `NEUROTWIN_API_KEY` is set)

```bash
# If auth is enabled, add this header to all caregiver requests:
# -H "X-API-Key: your-secret-key"

# List all people
curl http://localhost:8000/api/v1/people

# Register a person with photo (indexes face vector)
curl -X POST http://localhost:8000/api/v1/people/with-photo \
  -F "name=Sarah Varma" \
  -F "relationship=Daughter" \
  -F "birthday=1992-04-14" \
  -F "memory=Brought blueberry muffins yesterday" \
  -F "photos=@sarah_reference.jpg"

# List memories
curl http://localhost:8000/api/v1/memories

# Create a memory
curl -X POST http://localhost:8000/api/v1/memories \
  -H "Content-Type: application/json" \
  -d '{"title": "Graduated law school", "description": "In 2016", "category": "life_event"}'

# List medicines
curl http://localhost:8000/api/v1/medicines

# List emergency contacts
curl http://localhost:8000/api/v1/emergency-contacts

# List tracked objects
curl http://localhost:8000/api/v1/objects

# Get last-seen location for an object
curl http://localhost:8000/api/v1/objects/reading_glasses/location

# Delete any resource (people, memories, medicines, contacts)
curl -X DELETE http://localhost:8000/api/v1/people/p_001
curl -X DELETE http://localhost:8000/api/v1/memories/mem_01
curl -X DELETE http://localhost:8000/api/v1/medicines/med_01
curl -X DELETE http://localhost:8000/api/v1/emergency-contacts/em_01
```

---

## 6. Enabling API Authentication

For production or network-accessible deployments:

```bash
# Set the API key
export NEUROTWIN_API_KEY=my-super-secret-key

# Or add to .env
echo "NEUROTWIN_API_KEY=my-super-secret-key" >> backend/.env

# Restart the backend
cd backend
.venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Now caregiver endpoints require the header:
```bash
curl -H "X-API-Key: my-super-secret-key" http://localhost:8000/api/v1/people
```

Patient-facing endpoints (`/health`, `/frame`, `/voice-query`) remain open.

---

## 7. Android Mobile Client

The mobile app is in `mobile/` and requires Android Studio.

### Build & Run
1. Open `mobile/` in Android Studio
2. Sync Gradle
3. Run on emulator or physical device
4. The app connects to `http://10.0.2.2:8000/` (emulator) — change `BASE_URL` in `NeuroTwinApiService.kt` for physical device on LAN

### What the mobile client does
- **CameraX** captures frames continuously
- **ML Kit** filters frames with faces locally (no upload if no face)
- Gated frames are uploaded to `POST /frame` for InsightFace embedding + Qdrant match
- Matched person context is displayed on the senior-friendly UI
- Voice queries are sent as JSON to `POST /voice-query`
- Audio recordings can be sent to `POST /voice-query/audio` for server-side STT

---

## 8. Directory Structure

```
Neuro_Twin/
├── start.sh                  # One-command startup script
├── docker-compose.yml        # Docker Compose (Qdrant + FastAPI)
├── USAGE.md                  # This file
├── backend/
│   ├── Dockerfile            # Backend container build
│   ├── seed.py               # Database seed script
│   ├── app/
│   │   ├── main.py              # FastAPI app + middleware
│   │   ├── config.py            # Environment settings
│   │   ├── schemas.py           # Pydantic models
│   │   ├── auth.py              # API key authentication
│   │   ├── services/
│   │   │   ├── qdrant_service.py    # Vector DB (people + objects)
│   │   │   ├── face_service.py      # InsightFace 512-d embeddings
│   │   │   ├── stt_service.py       # Whisper speech-to-text
│   │   │   ├── llm_service.py       # Ollama/Groq LLM reasoning
│   │   │   ├── tts_service.py       # Piper text-to-speech
│   │   │   ├── people_store.py      # Person profile registry
│   │   │   ├── context_cache.py     # Visual context TTL cache
│   │   │   └── json_store.py        # Generic JSON CRUD store
│   │   └── routers/
│   │       ├── health.py         # System telemetry
│   │       ├── frame.py          # Camera frame → face match
│   │       ├── voice.py          # Voice query → LLM → TTS
│   │       ├── people.py         # People CRUD + photo indexing
│   │       ├── memories.py       # Memory anchors CRUD
│   │       ├── medicines.py      # Medications CRUD
│   │       ├── emergency.py      # Emergency contacts CRUD
│   │       └── objects.py        # Object tracking queries
│   ├── qdrant/                   # Native Qdrant binary + config
│   ├── models/                   # AI model weights (~800MB total)
│   ├── data/                     # JSON persistent storage
│   ├── static/audio/             # Generated TTS WAV files
│   ├── static/photos/            # Uploaded reference photos
│   ├── .env                      # Configuration
│   └── requirements.txt
├── web/
│   ├── index.html                # Single-page app
│   ├── app.js                    # Frontend controller
│   └── styles.css                # Dark theme design system
├── mobile/                       # Android Kotlin + Compose app
│   └── app/src/main/java/com/neurotwin/app/
│       ├── MainActivity.kt       # Senior patient UI
│       ├── network/              # Retrofit API client
│       ├── ml/                   # ML Kit face detection
│       └── service/              # Camera foreground service
└── NeuroTwin/                    # Obsidian vault (project docs)
```

---

## 9. Troubleshooting

| Problem | Solution |
|---------|----------|
| `Qdrant DB connection failed` | Start Qdrant: `./qdrant/bin/qdrant --config-path qdrant/config.yaml` |
| `Ollama local LLM unavailable` | Start Ollama: `ollama serve` then `ollama pull qwen3:8b` |
| `Whisper model not found` | First run auto-downloads to `backend/models/whisper/` (~145MB) |
| `InsightFace model not found` | First run auto-downloads to `backend/models/insightface/` (~570MB) |
| `Piper model not found` | Already bundled at `backend/models/piper/en_US-lessac-medium.onnx` |
| Web dashboard shows "Backend offline" | Make sure FastAPI is running on port 8000 |
| `401 Invalid or missing X-API-Key` | Set `NEUROTWIN_API_KEY` env var or remove it from `.env` to disable auth |
| Mobile app can't connect | Check `BASE_URL` in `NeuroTwinApiService.kt` — use `10.0.2.2` for emulator, LAN IP for physical device |
| Port 8000 already in use | `kill -9 $(lsof -ti :8000)` then restart |

---

## 10. Architecture at a Glance

```
┌─────────────────────────────────────────────────────┐
│                   Android Phone                      │
│  CameraX → ML Kit Filter → Upload gated frames      │
│  Microphone → Record → Upload audio                  │
│  Display: Recognition card + Voice response          │
└──────────┬──────────────────────────┬───────────────┘
           │ POST /frame              │ POST /voice-query
           ▼                          ▼
┌─────────────────────────────────────────────────────┐
│              FastAPI Backend (M4 MacBook)            │
│                                                      │
│  /frame → InsightFace → 512-d embedding              │
│         → Qdrant cosine search → person context      │
│         → Cache visual context (TTL 120s)            │
│                                                      │
│  /voice-query → LLM (Ollama qwen3:8b)               │
│               → Piper TTS → WAV audio                │
│               → Return transcript + response + audio  │
│                                                      │
│  /people CRUD → people_store.py (JSON)               │
│              → Qdrant people collection               │
│                                                      │
│  /memories, /medicines, /emergency-contacts          │
│              → json_store.py (persistent JSON)        │
└─────────────────────────────────────────────────────┘
           │                          │
           ▼                          ▼
┌──────────────────┐    ┌──────────────────────┐
│   Qdrant :6333   │    │   Ollama :11434       │
│  people (512-d)  │    │   qwen3:8b (8.2B)    │
│  objects (128-d) │    │   ~11s response       │
└──────────────────┘    └──────────────────────┘
```
