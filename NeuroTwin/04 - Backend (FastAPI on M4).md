---
project: NeuroTwin
tags: [neurotwin, neurotwin/backend]
status: in-progress
created: 2026-08-19
updated: 2026-08-19
---

# Backend (FastAPI on M4)

## Role as Central Orchestrator

The backend serves as the core intelligence hub for NeuroTwin. Developed with **FastAPI** (Python 3.11+), it runs locally on an **Apple M4 MacBook Air**. 

The backend is responsible for receiving filtered frames and voice snippets from the Android client, executing computer vision models, interacting with the Qdrant vector database, managing LLM context, driving Text-to-Speech synthesis, and providing CRUD endpoints for the caregiver interface.

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
├── static/audio/               # Piper TTS WAV output
├── static/photos/              # Uploaded reference photos
├── models/                     # Bundled AI model weights (auto-downloaded)
│   ├── insightface/models/buffalo_l/
│   ├── whisper/models/Systran--faster-whisper-base/
│   └── piper/en_US-lessac-medium.onnx
├── qdrant/                     # Native Qdrant binary + storage
└── app/
    ├── __init__.py
    ├── main.py                 # FastAPI App instance, CORS, router mounting
    ├── config.py               # Pydantic BaseSettings (env-backed)
    ├── schemas.py              # Request/Response Pydantic models
    ├── services/
    │   ├── qdrant_service.py   # Qdrant vector DB (UUID conversion, people+objects)
    │   ├── face_service.py     # InsightFace buffalo_l 512-d embedding (graceful fallback)
    │   ├── object_service.py   # YOLOv8-nano household object detection
    │   ├── ble_service.py      # BLE beacon RSSI triangulation for room-level tracking
    │   ├── stt_service.py      # faster-whisper base (CPU int8) transcription
    │   ├── llm_service.py      # Ollama Qwen3-8B / Groq Llama 3 reasoning
    │   ├── tts_service.py      # Piper en_US-lessac-medium WAV synthesis
    │   ├── people_store.py     # JSON-backed person profile registry
    │   ├── context_cache.py    # In-memory TTL cache for visual context
    │   └── json_store.py       # Generic JSON CRUD store (memories, meds, contacts)
    └── routers/
        ├── health.py           # GET /api/v1/health (real telemetry)
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
| `POST` | `/api/v1/voice-query` | JSON text → LLM → TTS | `VoiceQueryRequest` | `VoiceQueryResponse` | ✅ Tested |
| `POST` | `/api/v1/voice-query/audio` | Multipart audio → Whisper STT → LLM → TTS | `audio` file | `VoiceQueryResponse` | ✅ Tested |
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

## Hardware & Resource Sharing Considerations

> [!important] M4 Resource Sharing & Benchmarking
> The backend host (Apple M4 MacBook Air) is a shared local server. It simultaneously hosts:
> 1. FastAPI application process (`backend/`).
> 2. Qdrant vector database container.
> 3. Server-side vision & TTS models (InsightFace, YOLO, Piper/Kokoro, Whisper).
> 4. **An existing local Ollama instance running Qwen3-8B** for other workloads.

---

## Related Documentation
- [[05 - AI Pipeline]] — Server-side model details (InsightFace, Qdrant, Whisper, LLM, TTS).
- [[06 - Data Model (Qdrant Schema)]] — Vector collection definitions and payload structures.
- [[09 - Decisions Log]] — ADR #5 (Modular Router & Services Architecture).
