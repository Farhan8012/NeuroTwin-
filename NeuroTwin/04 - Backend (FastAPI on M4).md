---
project: NeuroTwin
tags: [neurotwin, neurotwin/backend]
status: draft
created: 2026-08-19
updated: 2026-08-19
---

# Backend (FastAPI on M4)

## Role as Central Orchestrator

The backend serves as the core intelligence hub for NeuroTwin. Developed with **FastAPI** (Python 3.11+), it runs locally on an **Apple M4 MacBook Air**. 

The backend is responsible for receiving filtered frames and voice snippets from the Android client, executing computer vision models, interacting with the Qdrant vector database, managing LLM context, driving Text-to-Speech synthesis, and providing CRUD endpoints for the caregiver interface.

---

## Endpoint API Specification Sketch

| Method | Endpoint | Description | Request Payload | Response Payload |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/frame` | Process incoming camera frame | `multipart/form-data` (JPEG image byte stream) | `{ match: bool, person: { name, relation, context }, confidence: float }` |
| `POST` | `/voice-query` | Process spoken patient audio query | `multipart/form-data` (WAV/AAC audio file) | `{ transcript: str, llm_response: str, tts_audio_url: str }` |
| `GET` | `/people` | List all registered people | Query params (page, limit) | Array of registered profiles with vector metadata |
| `POST` | `/people` | Register new person & generate embeddings | `{ name, relationship, photos[], memories[] }` | `{ id: str, status: "indexed" }` |
| `GET/POST` | `/memories` | CRUD for stories, life events, songs | JSON body | Updated memory payload |
| `GET/POST` | `/medicines` | Schedule & medication entries | JSON body | Medication reminders & logs |
| `GET/POST` | `/emergency-contacts` | Emergency contact management | JSON body | Contact list |
| `GET` | `/health` | System health check & resource check | None | `{ status: "ok", qdrant: "connected", ollama: "online" }` |

---

## Hardware & Resource Sharing Considerations

> [!important] M4 Resource Sharing & Benchmarking
> The backend host (Apple M4 MacBook Air) is a shared local server. It simultaneously hosts:
> 1. FastAPI application process.
> 2. Qdrant vector database container.
> 3. Server-side vision & TTS models (InsightFace, YOLO, Piper/Kokoro, Whisper).
> 4. **An existing local Ollama instance running Qwen3-8B** for other workloads.

Because Unified Memory and GPU cores are shared across these processes, rigorous latency and memory benchmarking must be conducted under real load before assuming sufficient headroom for hosting all LLM inference locally.

---

## Async Architecture & Performance Optimization

- **Uvicorn + FastAPI:** Uses Python `asyncio` non-blocking endpoints for I/O-bound tasks (network requests, database reads).
- **Background Worker Threads:** Heavy CPU/GPU bound model inferences (InsightFace embedding generation, YOLO object detection) are offloaded to `concurrent.futures.ProcessPoolExecutor` or dedicated GPU task queues to avoid blocking Uvicorn's event loop.
- **In-Memory Session Caching:** Recently matched visual contexts are held in an in-memory TTL cache (e.g., Redis or in-process LRU cache) so that subsequent voice queries within a short window can instantly access visual state without re-querying Qdrant.

---

## Related Documentation
- [[05 - AI Pipeline]] — Server-side model details (InsightFace, Qdrant, Whisper, LLM, TTS).
- [[06 - Data Model (Qdrant Schema)]] — Vector collection definitions and payload structures.
- [[13 - Dev Environment and Tooling]] — Server environment setup on macOS.
