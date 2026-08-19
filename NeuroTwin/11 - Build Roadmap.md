---
project: NeuroTwin
tags: [neurotwin, neurotwin/roadmap]
status: draft
created: 2026-08-19
updated: 2026-08-19
---

# Build Roadmap

## Phased Implementation Plan

The development of NeuroTwin is structured into seven sequential phases, prioritizing core end-to-end functionality before layer polishing.

---

### Phase 1: Backend Skeleton Setup
- [ ] Initialize FastAPI project repository with async structure.
- [ ] Spin up local Qdrant vector database container via Docker on M4.
- [ ] Implement base database connections and configuration management.
- [ ] Build and verify basic `/health` status endpoint.

---

### Phase 2: Mobile Capture & Gating Plumbing
- [ ] Scaffold native Android application using Kotlin + Jetpack Compose.
- [ ] Configure CameraX lifecycle frame capture throttled to 1–2 fps.
- [ ] Integrate local Google ML Kit Face & Object Detection models on-device.
- [ ] Implement Retrofit network service to upload gated frames to backend `POST /frame` endpoint.
- [ ] Verify image upload pipeline without AI recognition active.

---

### Phase 3: Face Recognition & Vector Matching Loop
- [ ] Integrate InsightFace (or FaceNet) model into FastAPI backend process.
- [ ] Build Qdrant `people` collection schema and cosine similarity search logic.
- [ ] Implement basic Caregiver `POST /people` endpoint to upload photos and index face vectors.
- [ ] Complete visual recognition pipeline (frame upload → embedding → Qdrant match → return person context).

---

### Phase 4: Conversational Voice Loop
- [ ] Implement mobile microphone audio recording and AAC/WAV compression.
- [ ] Integrate OpenAI Whisper STT on FastAPI backend to transcribe audio queries.
- [ ] Build prompt assembly module combining Whisper transcript + retrieved Qdrant visual context.
- [ ] Connect LLM inference (Groq Llama 3 API / local Ollama Qwen3-8B).
- [ ] Integrate Piper/Kokoro TTS engine to synthesize audio responses.
- [ ] Wire mobile Bluetooth audio output routing (`AudioManager`) for earbud playback.

---

### Phase 5: Object Recognition & Location Tracking
- [ ] Integrate server-side YOLO model into backend vision pipeline.
- [ ] Build Qdrant `objects` collection to record item location logs (glasses, keys, wallet, medicines).
- [ ] Enable conversational queries like *"Where are my glasses?"* powered by YOLO location history.

---

### Phase 6: Caregiver Application & CRUD Features
- [ ] Develop Caregiver management UI (Web dashboard or Android screen).
- [ ] Implement full CRUD workflows for family memories, life stories, favorite songs, and hobbies.
- [ ] Add medication schedule and emergency contact management endpoints.
- [ ] Build interaction history log viewer.

---

### Phase 7: Hardening, Battery Optimization & Privacy Pass
- [ ] Refine Android Foreground Service and WorkManager persistence across device backgrounding.
- [ ] Benchmark thermal throttling and battery consumption on mobile client over multi-hour runs.
- [ ] Conduct performance benchmarking on M4 backend (Ollama vs. Groq resource utilization).
- [ ] Complete comprehensive privacy, biometric security, and data minimization audit.

---

## Related Documentation
- [[02 - Architecture Overview]] — Technical target architecture.
- [[08 - Tech Stack]] — Software and hardware components.
- [[12 - Open Questions]] — Unresolved questions impacting roadmap items.
