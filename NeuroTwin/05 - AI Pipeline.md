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

## 1. Face Recognition Flow

1. **Embedding Extraction:**
   - Server receives a gated camera frame containing a face.
   - **InsightFace `buffalo_l`** (onnxruntime CPU) normalizes alignment and crops the facial ROI, generating a 512-dimensional floating-point feature vector. Model cached in `backend/models/insightface/`.
2. **Vector Similarity Query:**
   - The vector is queried against Qdrant's `people` collection using **Cosine Similarity**.
3. **Thresholding & Matching:**
   - Match criteria: `FACE_MATCH_THRESHOLD` (default `0.50`, tunable via `.env`; reference-quality photos score ~0.9+, low-res gated frames lower but stay well-separated from impostors).
   - **Above Threshold:** Returns person payload (`name`, `relationship`, `birthday`, `memories`, `family_stories`).
   - **Below Threshold:** Categorized as "Unknown Person". Prompts system to optionally offer caregiver notification or warm generic response.

---

## 2. Object Recognition Flow

1. **YOLO Detection:**
   - For object queries (e.g., *"Where are my glasses?"* or *"Where did I put my keys?"*), frames are passed through **YOLO** (YOLOv8/v9). *Integration pending (Phase 5).*
2. **Spatial & Temporal Tracking:**
   - When key items (glasses, keys, wallet, pill bottle) are detected in frames, the backend logs the detected class, bounding box, timestamp, and room/environmental context into the Qdrant `objects` collection.
3. **Retrieval Strategy:**
   - When a patient asks about an object's location, the backend fetches the most recent logged location record for that object class (`app/services/qdrant_service.py::latest_object_location`).

---

## 3. Voice Processing & Conversational Flow

1. **Speech-to-Text (Whisper):**
   - Spoken audio from the mobile microphone is transcribed using **faster-whisper `base`** (CPU, int8 quantization) — cached in `backend/models/whisper/`. Audio files are deleted immediately after transcription (ephemeral buffering, see [[10 - Privacy and Ethics]]).
2. **Context Bundle Assembly:**
   - The transcript is merged with the active visual context (from the in-memory TTL cache) and retrieved person memories into a structured LLM prompt.
3. **Language Model Reasoning:**
   - The assembled prompt is processed by the selected LLM (`app/services/llm_service.py`): local **Ollama Qwen3-8B** by default, **Groq Llama 3** when `LLM_PROVIDER=groq`. Falls back to warm rule responses when the provider is offline.
4. **Text-to-Speech Synthesis (Piper):**
   - The response text is synthesized with **Piper** (`en_US-lessac-medium` voice) into WAV streams served from `/static/audio/` for the patient's Bluetooth earpiece.

---

## Prompt Design & Persona Engineering

The system prompt strictly governs the tone and personality of the LLM:

> [!note] System Prompt Persona Guidelines
> - **Tone:** Warm, gentle, reassuring, simple, and story-shaped.
> - **Avoid:** Clinical lookup responses, robotic announcements, or overwhelming detail.
> - **Example Bad Response:** *"Identified subject: Sarah Varma. ID: 4092. Relationship: Daughter."*
> - **Example Good Response:** *"That is your daughter Sarah. She visited you yesterday afternoon and brought your favorite blueberry muffins."*

---

## Open Decision: LLM Engine Choice

> [!question] LLM: Groq Cloud API vs. Local Ollama Qwen3-8B
> - **Groq-Hosted Llama 3:** Extremely fast inference, free tier availability, offloads compute from the M4 server. Requires active internet connection and transmits voice transcripts off-device.
> - **Local Ollama + Qwen3-8B:** 100% private LAN operation, self-hosted independence, zero cloud reliance. Competes directly for M4 CPU/GPU memory resources alongside Qdrant, InsightFace, YOLO, Whisper, and TTS.
> 
> **Decision Rule:** Benchmark both approaches under full concurrent pipeline load once the backend skeleton is complete.

---

## Related Documentation
- [[04 - Backend (FastAPI on M4)]] — Server orchestrator executing model tasks.
- [[06 - Data Model (Qdrant Schema)]] — Vector payload structure for matched entities.
- [[12 - Open Questions]] — Master list of unresolved architectural decisions.
