---
project: NeuroTwin
tags: [neurotwin, neurotwin/ai-pipeline]
status: draft
created: 2026-08-19
updated: 2026-08-19
---

# AI Pipeline

## Overview of Model Subsystems

The NeuroTwin AI pipeline combines vision, vector retrieval, speech recognition, natural language reasoning, and speech synthesis into a cohesive cognitive support engine.

```
Visual Path:  Frame ──> InsightFace/YOLO ──> Embedding ──> Qdrant Vector Match ──┐
                                                                                 ├──> LLM Prompt ──> TTS Audio
Voice Path:   Audio ──> Whisper STT ───────> Transcript ─────────────────────────┘
```

---

## 1. Face Recognition Flow (✅ Tested & Passing)

1. **Embedding Extraction:**
   - Server receives a gated camera frame containing a face.
   - **InsightFace `buffalo_l`** (onnxruntime CPU) normalizes alignment and crops the facial ROI, generating a 512-dimensional floating-point feature vector. Model cached in `backend/models/insightface/models/buffalo_l/`.
   - **Test result:** Synthetic 160×160 image → 512-d embedding, unit norm (1.0000). PASS.
2. **Vector Similarity Query:**
   - The vector is queried against Qdrant's `people` collection using **Cosine Similarity** via `query_points()`.
   - **Test result:** Self-match returns score 1.000 with correct payload. PASS.
3. **Thresholding & Matching:**
   - Match criteria: `FACE_MATCH_THRESHOLD` (default `0.50`, tunable via `.env`; reference-quality photos score ~0.9+, low-res gated frames lower but stay well-separated from impostors).
   - **Above Threshold:** Returns person payload (`name`, `relationship`, `birthday`, `memories`, `family_stories`).
   - **Below Threshold:** Categorized as "Unknown Person". Prompts system to optionally offer caregiver notification or warm generic response.

---

## 2. Object Recognition Flow (✅ Integrated)

1. **YOLO Detection:**
   - `object_service.py` runs **YOLOv8-nano** on every uploaded frame. Detects household objects: phone, remote, book, cup, bottle, scissors, chair, TV, laptop, and potted plant.
   - Target classes are filtered to items relevant for memory-impaired patients (defined in `TARGET_CLASSES` dict).
   - Graceful fallback: if `ultralytics` is not installed, detection returns empty list and the frame still processes for face recognition.
2. **Embedding & Storage:**
   - Each detected object is cropped from the frame and converted to a 128-d embedding (normalized pixel features).
   - Objects are indexed into Qdrant's `objects` collection with `object_class`, `label`, `confidence`, and `last_seen_timestamp`.
3. **Retrieval Strategy:**
   - When a patient asks about an object's location, the backend fetches the most recent logged location record via `qdrant_service.latest_object_location()`.
4. **BLE Enhancement (optional):**
   - For higher-accuracy room-level tracking, BLE beacons can be attached to objects. See `ble_service.py` for RSSI triangulation across fixed receiver beacons.
   - BLE data supplements visual detection — if an object has a registered beacon, its room location is updated via `POST /api/v1/ble/rssi`.

---

## 3. Voice Processing & Conversational Flow (✅ Tested & Passing)

1. **Speech-to-Text (Whisper):**
   - Spoken audio from the mobile microphone is transcribed using **faster-whisper `base`** (CPU, int8 quantization) — cached in `backend/models/whisper/`. Audio files are deleted immediately after transcription (ephemeral buffering, see [[10 - Privacy and Ethics]]).
   - **Test result:** Model loads, processes 1s WAV, returns empty text for sine wave (expected). PASS.
2. **Context Bundle Assembly:**
   - The transcript is merged with the active visual context (from the in-memory TTL cache) and retrieved person memories into a structured LLM prompt.
   - **Test result:** `context_cache.store_visual_context()` → `get_visual_context()` round-trips correctly. PASS.
3. **Language Model Reasoning:**
   - The assembled prompt is processed by the selected LLM (`app/services/llm_service.py`): local **Ollama Qwen3-8B** by default, **Groq Llama 3** when `LLM_PROVIDER=groq`. Falls back to warm rule responses when the provider is offline.
   - **Test result:** Ollama `qwen3:8b` generates warm companion response in ~11s. "Sweetheart, that's your daughter, Sarah! She brought you those warm muffins yesterday..." PASS.
4. **Text-to-Speech Synthesis (Piper):**
   - The response text is synthesized with **Piper** (`en_US-lessac-medium` voice) into WAV streams served from `/static/audio/` for the patient's Bluetooth earpiece.
   - **Test result:** "This is your daughter Sarah." → 59KB WAV file generated. PASS.

---

## Prompt Design & Persona Engineering

The system prompt strictly governs the tone and personality of the LLM:

> [!note] System Prompt Persona Guidelines
> - **Tone:** Warm, gentle, reassuring, simple, and story-shaped.
> - **Avoid:** Clinical lookup responses, robotic announcements, or overwhelming detail.
> - **Example Bad Response:** *"Identified subject: Sarah Varma. ID: 4092. Relationship: Daughter."*
> - **Example Good Response:** *"That is your daughter Sarah. She visited you yesterday afternoon and brought your favorite blueberry muffins."*

---

## LLM Engine: Resolved

> [!done] Decision: Ollama Qwen3-8B (Default)
> Local **Ollama Qwen3-8B** (Q4_K_M quantization, 8.2B parameters) runs as the default LLM provider.
> - **Latency:** ~11-15s per response on M4 MacBook Air.
> - **Privacy:** 100% local LAN — no data leaves the device.
> - **Fallback:** When Ollama is offline, `llm_service.py` returns warm rule-based responses (e.g., "This is your daughter Sarah...").
> - **Alternative:** Groq Llama 3 API supported via `LLM_PROVIDER=groq` config. Faster but requires internet and sends transcripts off-device.

---

## Related Documentation
- [[04 - Backend (FastAPI on M4)]] — Server orchestrator executing model tasks.
- [[06 - Data Model (Qdrant Schema)]] — Vector payload structure for matched entities.
- [[03 - Mobile Client (Android)]] — Mobile voice conversation and BLE scanning.
- [[11 - Build Roadmap]] — Implementation phases.
