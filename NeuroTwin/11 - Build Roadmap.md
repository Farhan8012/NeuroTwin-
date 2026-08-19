---
project: NeuroTwin
tags: [neurotwin, neurotwin/roadmap]
status: in-progress
created: 2026-08-19
updated: 2026-08-19
---

# Build Roadmap

## Phased Implementation Plan

The development of NeuroTwin is structured into seven sequential phases, prioritizing core end-to-end functionality before layer polishing.

---

### Phase 1: Backend Skeleton Setup (Completed)
- [x] Initialize FastAPI project repository with async structure (`backend/`).
- [x] Configure Pydantic schemas, settings management, and CORS middleware.
- [x] Implement APIRouters for `/health`, `/frame`, `/voice-query`, and `/people`.
- [x] Build and verify basic `/health` status endpoint.

---

### Phase 2: Mobile Capture & Gating Plumbing (Completed)
- [x] Scaffold native Android application using Kotlin + Jetpack Compose (`mobile/`).
- [x] Configure CameraX lifecycle frame capture & CameraForegroundService.
- [x] Integrate local Google ML Kit Face Detection gating model (`MlKitFilter.kt`).
- [x] Implement Retrofit network service (`RetrofitClient`) to upload gated frames to backend `POST /frame` endpoint.
- [x] Build native Jetpack Compose main UI screen (`MainActivity.kt`).

---

### Phase 3: Face Recognition & Vector Matching Loop (Completed)
- [x] Integrate InsightFace 512-d embedding extraction service (`face_service.py`).
- [x] Build Qdrant client connection service (`qdrant_service.py`) for `people` collection cosine search.
- [x] Implement Caregiver `POST /people` endpoint to upload photos and index face vectors.
- [x] Complete visual recognition pipeline (`POST /frame` → embedding → Qdrant match → return person context).

---

### Phase 4: Conversational Voice Loop (Completed)
- [x] Implement mobile microphone query dispatch via Retrofit.
- [x] Build prompt assembly and LLM reasoning service (`llm_service.py`) supporting Ollama (Qwen3-8B).
- [x] Build warm cognitive companion persona fallback.
- [x] Integrate TTS response payload delivery.

---

### Phase 5: Object Recognition & Location Tracking (Completed)
- [x] Integrate object detection logging in vision pipeline (`POST /frame`).
- [x] Build location tracking query responses for misplaced items (glasses, keys).
- [x] Add `objects` router (`GET /objects`, `GET /objects/{class}/location`).
- [x] Qdrant `objects` collection with 128-d vectors and `latest_object_location` query.
- [x] Implement `object_service.py` with YOLOv8-nano household object detection.
- [x] Objects indexed to Qdrant with embeddings for location tracking.
- [x] Add BLE beacon service (`ble_service.py`) for room-level RSSI triangulation.
- [x] Add `ble` router with beacon registration, RSSI reporting, and location queries.
- [x] Add `BLEScannerService` (background foreground service) for continuous beacon scanning.
- [x] Add 32-endpoint OpenAPI schema with examples, descriptions, and 9 tagged categories.

---

### Phase 6: Caregiver Application & UI (Completed)
- [x] Design senior-accessible, high-contrast UI with 72px touch targets and 32px headers.
- [x] Implement web companion interface in `web/` supporting Patient Companion Mode and Caregiver Mode.
- [x] Connect web interface to FastAPI backend endpoints (`/health`, `/people`, `/memories`, `/medicines`, `/emergency-contacts`).
- [x] 5-tab Caregiver layout: People / Memories / Medicines / Emergency / Telemetry.
- [x] Full CRUD modals for Memories, Medicines, and Emergency Contacts.
- [x] Tab-based navigation with lazy data loading per panel.

---

### Phase 7: Hardening, Voice Conversation & Test Suite (Completed)
- [x] Fix Qdrant client UUID conversion for deterministic point IDs across people/objects.
- [x] Fix `json_store.py` ID generation bug (empty IDs from payload overriding UUIDs).
- [x] Increase Ollama LLM timeout from 5s to 30s for 8B model inference.
- [x] Add visual context cache integration into voice query pipeline for conversational continuity.
- [x] Fix `health.py` bug: `qdrant_service.get_client()` → `qdrant_service.client`.
- [x] Remove duplicate seed data from routers (memories, medicines, emergency).
- [x] Rewrite `face_service.py` with real InsightFace ArcFace integration + graceful fallback.
- [x] Create `object_service.py` with YOLOv8-nano household object detection.
- [x] Complete `CameraForegroundService` with CameraX pipeline + ML Kit gating + async upload.
- [x] Add `VoiceRecorder` (WAV 16kHz mono PCM) and `VoiceConversationManager` for full conversation loop.
- [x] Rewrite `MainActivity` with hold-to-talk voice UI, response card, audio playback.
- [x] Create 58-test pytest suite under `backend/tests/` covering all endpoints.
- [x] Add BLE beacon service for room-level RSSI triangulation.
- [x] Update all Obsidian vault documentation.
- [x] Docker Compose deployment with Qdrant + FastAPI + Nginx web dashboard.
- [ ] Refine Android Foreground Service and WorkManager persistence across device backgrounding.
- [ ] Benchmark thermal throttling and battery consumption on mobile client over multi-hour runs.

---

## Related Documentation
- [[02 - Architecture Overview]] — Technical target architecture.
- [[03 - Mobile Client (Android)]] — Mobile client architecture.
- [[04 - Backend (FastAPI on M4)]] — Backend service endpoints.
- [[07 - Caregiver App]] — Caregiver portal specification.
- [[08 - Tech Stack]] — Software and hardware components.
