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

## Directory Architecture (`backend/`)

```
backend/
├── requirements.txt
└── app/
    ├── __init__.py
    ├── main.py            # FastAPI App instance & CORS configuration
    ├── config.py          # Settings management (Pydantic BaseSettings)
    ├── schemas.py         # Request/Response Pydantic schemas
    └── routers/
        ├── health.py      # Health & system telemetry endpoint (/api/v1/health)
        ├── frame.py       # Vision embedding & Qdrant query (/api/v1/frame)
        ├── voice.py       # Whisper STT + LLM story + TTS synthesis (/api/v1/voice-query)
        └── people.py      # Caregiver CRUD for registered people (/api/v1/people)
```

---

## Endpoint API Specification

| Method | Endpoint | Description | Request Payload | Response Payload | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/health` | System health check & resource check | None | `{ status: "online", components, system_metrics }` | Implemented |
| `POST` | `/api/v1/frame` | Process incoming camera frame | `multipart/form-data` | `{ matched: true, person: { ... }, processing_time_ms }` | Implemented |
| `POST` | `/api/v1/voice-query` | Process spoken patient audio query | `VoiceQueryRequest` | `{ transcript, llm_response, tts_audio_url }` | Implemented |
| `GET` | `/api/v1/people` | List all registered people | None | Array of registered profiles with vector metadata | Implemented |
| `POST` | `/api/v1/people` | Register new person & generate embeddings | `PersonCreate` | `{ id: "p_03", name: "...", status: "indexed" }` | Implemented |
| `GET` | `/api/v1/people/{id}` | Fetch specific person profile | Path param `id` | `PersonResponse` | Implemented |

---

## Hardware & Resource Sharing Considerations

> [!important] M4 Resource Sharing & Benchmarking
> The backend host (Apple M4 MacBook Air) is a shared local server. It simultaneously hosts:
> 1. FastAPI application process (`backend/`).
> 2. Qdrant vector database container.
> 3. Server-side vision & TTS models (InsightFace, YOLO, Piper/Kokoro, Whisper).
> 4. **An existing local Ollama instance running Qwen3-8B** for other workloads.

---

## Async Architecture & Performance Optimization

- **Uvicorn + FastAPI:** Uses Python `asyncio` non-blocking endpoints for I/O-bound tasks.
- **Background Worker Threads:** Heavy CPU/GPU bound model inferences (InsightFace embedding generation, YOLO object detection) are offloaded to process executors to avoid blocking Uvicorn's event loop.
- **In-Memory Session Caching:** Recently matched visual contexts are held in an in-memory TTL cache so that subsequent voice queries within a short window can instantly access visual state without re-querying Qdrant.

---

## Related Documentation
- [[05 - AI Pipeline]] — Server-side model details (InsightFace, Qdrant, Whisper, LLM, TTS).
- [[06 - Data Model (Qdrant Schema)]] — Vector collection definitions and payload structures.
- [[09 - Decisions Log]] — ADR #5 (Modular Router Architecture).
