---
project: NeuroTwin
tags: [neurotwin, neurotwin/backend]
status: in-progress
created: 2026-08-19
updated: 2026-08-19
---

# Backend (FastAPI — Cloud-First with Local M4 Fallback)

## Role as Central Orchestrator

The backend serves as the core intelligence hub for NeuroTwin. Developed with **FastAPI** (Python 3.11+), it operates under a **Cloud-First, Local-Fallback** execution model:

- **1st Priority (Cloud APIs):** Routes requests to high-speed cloud APIs (Groq Llama 3.3 70B for LLM reasoning, Groq Whisper for STT, Qdrant Cloud for vector search, Google Cloud TTS) for sub-second conversational latency.
- **Backup Fallback (Local M4 Server):** Automatically switches to local server services (M4 MacBook Air or local server) with local Qdrant, Ollama Qwen3-8B, faster-whisper, and Piper TTS when cloud APIs are unavailable, unconfigured, or offline.

The backend receives filtered frames and voice snippets from the Android client, executes embeddings, interacts with vector collections, manages conversational TTL caches, delivers audio synthesis, and provides full CRUD endpoints for the caregiver dashboard.

---

## Complete Directory Architecture (`backend/`)

```
backend/
├── requirements.txt
├── .env.example
├── data/                       # JSON-backed persistent storage
│   ├── people.json
│   ├── memories.json
│   ├── medicines.json
│   └── emergency_contacts.json
├── static/audio/               # Generated TTS WAV output
├── static/photos/              # Uploaded reference photos
├── models/                     # Bundled local fallback AI model weights
│   ├── insightface/models/buffalo_l/
│   ├── whisper/models/Systran--faster-whisper-base/
│   └── piper/en_US-lessac-medium.onnx
├── qdrant/                     # Local fallback native Qdrant binary + storage
└── app/
    ├── __init__.py
    ├── main.py                 # FastAPI App instance, CORS, router mounting
    ├── config.py               # Pydantic BaseSettings (env-backed)
    ├── schemas.py              # Request/Response Pydantic models
    ├── services/
    │   ├── qdrant_service.py   # Qdrant Cloud client with local Qdrant fallback
    │   ├── face_service.py     # InsightFace buffalo_l 512-d embedding (graceful fallback)
    │   ├── object_service.py   # YOLOv8-nano household object detection
    │   ├── ble_service.py      # BLE beacon RSSI triangulation for room-level tracking
    │   ├── stt_service.py      # Groq Whisper STT with local faster-whisper fallback
    │   ├── llm_service.py      # Groq Llama 3.3 with Ollama / rule fallback
    │   ├── tts_service.py      # Cloud TTS with Piper en_US-lessac-medium fallback
    │   ├── people_store.py     # JSON-backed person profile registry
    │   ├── context_cache.py    # In-memory TTL cache for visual context
    │   └── json_store.py       # Generic JSON CRUD store (memories, meds, contacts)
    └── routers/
        ├── health.py           # GET /api/v1/health (telemetry for cloud & local components)
        ├── frame.py            # POST /api/v1/frame (face match + YOLO objects + context cache)
        ├── voice.py            # POST /api/v1/voice-query (JSON) + /audio (multipart)
        ├── people.py           # /api/v1/people CRUD + photo→vector indexing
        ├── memories.py         # /api/v1/memories CRUD (persistent JSON)
        ├── medicines.py        # /api/v1/medicines CRUD (persistent JSON)
        ├── emergency.py        # /api/v1/emergency-contacts CRUD (persistent JSON)
        ├── objects.py          # /api/v1/objects list + location query
        └── ble.py              # /api/v1/ble beacon registration + RSSI reporting
```

---

## Endpoint API Specification

| Method | Endpoint | Description | Request Payload | Response Payload | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/health` | System health & component telemetry | None | `{ status, components, system_metrics }` | ✅ Tested |
| `POST` | `/api/v1/frame` | Process camera frame → face match → context cache | `multipart/form-data` | `FrameProcessResponse` | ✅ Tested |
| `POST` | `/api/v1/voice-query` | JSON text → Cloud/Local LLM → TTS | `VoiceQueryRequest` | `VoiceQueryResponse` | ✅ Tested |
| `POST` | `/api/v1/voice-query/audio` | Multipart audio → Groq/Whisper STT → LLM → TTS | `audio` file | `VoiceQueryResponse` | ✅ Tested |
| `GET/POST` | `/api/v1/people` | List/register people profiles | `PersonCreate` | `PersonResponse[]` | ✅ Tested |
| `GET/PUT/DELETE` | `/api/v1/people/{id}` | Fetch/update/purge person + vectors | `PersonCreate` | `PersonResponse` | ✅ Tested |
| `POST` | `/api/v1/people/with-photo` | Photo upload → InsightFace embedding → Qdrant index | `multipart/form-data` | `PersonResponse` | ✅ Tested |
| `GET/POST` | `/api/v1/memories` | List/create memory anchors | `MemoryCreate` | `Memory[]` | ✅ Tested |
| `DELETE` | `/api/v1/memories/{id}` | Delete memory anchor | None | 204 | ✅ Tested |
| `GET/POST` | `/api/v1/medicines` | List/create medications | `MedicineItem` | `MedicineItem[]` | ✅ Tested |
| `DELETE` | `/api/v1/medicines/{id}` | Delete medication | None | 204 | ✅ Tested |
| `GET/POST` | `/api/v1/emergency-contacts` | List/create emergency contacts | `EmergencyContact` | `EmergencyContact[]` | ✅ Tested |
| `DELETE` | `/api/v1/emergency-contacts/{id}` | Delete contact | None | 204 | ✅ Tested |
| `GET` | `/api/v1/objects` | List tracked objects | None | `Object[]` | ✅ Tested |
| `GET` | `/api/v1/objects/{class}/location` | Last-seen location for object class | None | `ObjectLocation` | ✅ Tested |
| `GET` | `/api/v1/ble/beacons` | List registered BLE beacons | None | `BeaconResponse[]` | ✅ Tested |
| `POST` | `/api/v1/ble/beacons` | Register BLE beacon tag | `BeaconRegister` | `BeaconResponse` | ✅ Tested |
| `DELETE` | `/api/v1/ble/beacons/{id}` | Remove registered beacon | None | 204 | ✅ Tested |
| `POST` | `/api/v1/ble/rssi` | Submit RSSI reading for room estimation | `RSSIReport` | `LocationResponse` | ✅ Tested |
| `GET` | `/api/v1/ble/beacons/{id}/location` | Get current beacon location | None | `LocationResponse` | ✅ Tested |

---

## Test Suite

58 pytest tests under `backend/tests/` covering all endpoints, CRUD lifecycle, integration flows, and BLE triangulation.

---

## Deployment & Fallback Strategy

> [!important] Cloud-First Execution with Local M4 Fallback
> 1. **Primary Cloud Mode:** When `LLM_PROVIDER=groq` and `GROQ_API_KEY` is provided, requests are handled via Groq cloud infrastructure (<1s turnaround). Vector lookups hit Qdrant Cloud if configured.
> 2. **Local M4 Server Fallback:** If internet access fails or cloud API keys are missing:
>    - FastAPI automatically routes LLM generation to local Ollama (`qwen3:8b`).
>    - STT falls back to local `faster-whisper` on CPU.
>    - TTS falls back to local `piper` ONNX model.
>    - Vector search falls back to local Qdrant on port 6333 or in-memory mode.

---

## Related Documentation
- [[02 - Architecture Overview]] — Data flow and hybrid architecture.
- [[05 - AI Pipeline]] — Server-side model details and cloud API mappings.
- [[06 - Data Model (Qdrant Schema)]] — Vector collection definitions and payload structures.
- [[09 - Decisions Log]] — ADR #10 (Hybrid Cloud-First Architecture).
