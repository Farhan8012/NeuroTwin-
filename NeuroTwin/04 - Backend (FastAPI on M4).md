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
└── app/
    ├── __init__.py
    ├── main.py            # FastAPI App instance & CORS configuration
    ├── config.py          # Settings management (Pydantic BaseSettings)
    ├── schemas.py         # Request/Response Pydantic schemas
    ├── services/
    │   ├── qdrant_service.py # Qdrant client vector DB search & upsert
    │   ├── face_service.py   # InsightFace/FaceNet 512-d embedding extraction
    │   └── llm_service.py    # Ollama (Qwen3-8B) / Groq API companion reasoning
    └── routers/
        ├── health.py             # Health & system telemetry endpoint (/api/v1/health)
        ├── frame.py              # Vision embedding & Qdrant query (/api/v1/frame)
        ├── voice.py              # Whisper STT + LLM story + TTS synthesis (/api/v1/voice-query)
        ├── people.py             # Caregiver CRUD for registered people (/api/v1/people)
        ├── memories.py           # Caregiver CRUD for memory anchors (/api/v1/memories)
        ├── medicines.py          # Caregiver CRUD for medications (/api/v1/medicines)
        └── emergency.py          # Caregiver CRUD for emergency contacts (/api/v1/emergency-contacts)
```

---

## Endpoint API Specification

| Method | Endpoint | Description | Request Payload | Response Payload | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/health` | System health check & resource check | None | `{ status: "online", components, system_metrics }` | Implemented |
| `POST` | `/api/v1/frame` | Process incoming camera frame | `multipart/form-data` | `{ matched: true, person: { ... }, processing_time_ms }` | Implemented |
| `POST` | `/api/v1/voice-query` | Process spoken patient audio query | `VoiceQueryRequest` | `{ transcript, llm_response, tts_audio_url }` | Implemented |
| `GET/POST` | `/api/v1/people` | List/register people & index face vectors | `PersonCreate` | `PersonResponse` | Implemented |
| `GET/POST` | `/api/v1/memories` | List/create memory anchors & stories | `MemoryCreate` | Array of memory stories | Implemented |
| `GET/POST` | `/api/v1/medicines` | List/create medication schedule | `MedicineItem` | Medication list | Implemented |
| `GET/POST` | `/api/v1/emergency-contacts` | List/create emergency contacts | `EmergencyContact` | Emergency contacts list | Implemented |

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
