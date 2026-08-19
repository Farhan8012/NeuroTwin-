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

---

### Phase 6: Caregiver Application & UI (Completed)
- [x] Design senior-accessible, high-contrast UI with 72px touch targets and 32px headers.
- [x] Implement web companion interface in `web/` supporting Patient Companion Mode and Caregiver Mode.
- [x] Connect web interface to FastAPI backend endpoints (`/health`, `/people`, `/memories`, `/medicines`, `/emergency-contacts`).

---

### Phase 7: Hardening, Battery Optimization & Privacy Pass (In Progress)
- [ ] Refine Android Foreground Service and WorkManager persistence across device backgrounding.
- [ ] Benchmark thermal throttling and battery consumption on mobile client over multi-hour runs.
- [ ] Conduct performance benchmarking on M4 backend (Ollama vs. Groq resource utilization).
- [ ] Complete comprehensive privacy, biometric security, and data minimization audit.

---

## Related Documentation
- [[02 - Architecture Overview]] — Technical target architecture.
- [[03 - Mobile Client (Android)]] — Mobile client architecture.
- [[04 - Backend (FastAPI on M4)]] — Backend service endpoints.
- [[07 - Caregiver App]] — Caregiver portal specification.
- [[08 - Tech Stack]] — Software and hardware components.
