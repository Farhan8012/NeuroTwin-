---
project: NeuroTwin
tags: [neurotwin, neurotwin/ai-pipeline]
status: draft
created: 2026-08-19
updated: 2026-08-19
---

# AI Pipeline

## Overview of Model Subsystems

The NeuroTwin AI pipeline combines vision, vector retrieval, speech recognition, natural language reasoning, and speech synthesis into a cohesive cognitive support engine designed around a **Cloud-First, Local-Fallback** strategy.

```
Cloud Path (Priority 1):   Audio/Frame ──> Groq Whisper / InsightFace ──> Qdrant Cloud ──> Groq Llama 3.3 ──> Cloud TTS (<1.5s total)
                                                                                            │ (on failure)
Local Path (Backup M4):    Audio/Frame ──> Local Whisper / InsightFace ──> Local Qdrant ──> Ollama Qwen3-8B ──> Piper TTS (~15-25s total)
```

---

## 1. Face Recognition Flow

1. **Embedding Extraction:**
   - Server receives a gated camera frame containing a face.
   - **InsightFace `buffalo_l`** (onnxruntime CPU) normalizes alignment and crops facial ROI, generating a 512-dimensional floating-point feature vector.
   - Fallback: deterministic normalized pixel hash if model weights are unavailable.
2. **Vector Similarity Query (Cosine):**
   - **Priority 1 (Qdrant Cloud):** Queried against cloud-hosted Qdrant cluster for instant synchronization.
   - **Backup (Local Qdrant):** Queried against native local Qdrant binary on port `6333` (or `:memory:` mode).
3. **Thresholding & Matching:**
   - Match criteria: `FACE_MATCH_THRESHOLD` (default `0.50`).
   - **Above Threshold:** Returns person payload (`name`, `relationship`, `birthday`, `memories`, `family_stories`).
   - **Below Threshold:** Categorized as "Unknown Person".

---

## 2. Object Recognition Flow

1. **Detection:**
   - **On-Device (Priority 1):** Android Google ML Kit Object Detection filters and categorizes household items before network transmission.
   - **Server (Priority 2):** `object_service.py` runs **YOLOv8-nano** on uploaded frames.
2. **Vector Indexing & Tracking:**
   - Detected objects are logged to Qdrant's `objects` collection with timestamp, bounding box, and room location.
3. **BLE Triangulation Enhancement:**
   - Registered BLE beacon tags attached to physical items (glasses, keys) submit RSSI readings to `POST /api/v1/ble/rssi` for room-level triangulation.

---

## 3. Voice Processing & Conversational Flow

```
┌─────────────────┬──────────────────────────────────┬─────────────────────────────────┐
│ Component       │ 1st Priority (Cloud API)         │ Backup Fallback (Local M4)      │
├─────────────────┼──────────────────────────────────┼─────────────────────────────────┤
│ Speech-to-Text  │ Groq Whisper (whisper-large-v3)  │ faster-whisper (base int8 CPU)  │
│ LLM Reasoning   │ Groq Llama 3.3 70B Versatile     │ Ollama Qwen3-8B / Rule Persona  │
│ Text-to-Speech  │ Google Cloud TTS / Azure Neural  │ Piper TTS (en_US-lessac-medium) │
└─────────────────┴──────────────────────────────────┴─────────────────────────────────┘
```

1. **Speech-to-Text (STT):**
   - *Primary:* **Groq Whisper Cloud API** (~0.8s latency, Whisper Large v3 accuracy).
   - *Fallback:* Local **faster-whisper `base`** running on server CPU.
2. **Context Bundle Assembly:**
   - Transcript is merged with the active visual context (from the in-memory TTL cache) and retrieved person memories into a structured LLM prompt.
3. **Language Model Reasoning:**
   - *Primary:* **Groq Cloud API (`llama-3.3-70b-versatile`)** provides warm companion responses in ~0.5s.
   - *Fallback:* Local **Ollama Qwen3-8B** (~15-25s) or rule-based fallback persona.
4. **Text-to-Speech Synthesis (TTS):**
   - *Primary:* **Google Cloud / Azure Neural TTS** generates natural, lifelike audio.
   - *Fallback:* Local **Piper TTS** (`en_US-lessac-medium` ONNX) synthesizes WAV audio served from `/static/audio/`.

---

## Prompt Design & Persona Engineering

The system prompt strictly governs the tone and personality of the LLM:

> [!note] System Prompt Persona Guidelines
> - **Tone:** Warm, gentle, reassuring, simple, and story-shaped.
> - **Avoid:** Clinical lookup responses, robotic announcements, or overwhelming detail.
> - **Example Bad Response:** *"Identified subject: Sarah Varma. ID: 4092. Relationship: Daughter."*
> - **Example Good Response:** *"That is your daughter Sarah. She visited you yesterday afternoon and brought your favorite blueberry muffins."*

---

## LLM Engine Strategy: Cloud-First Hybrid (ADR #10)

> [!done] Decision: Groq Cloud (Primary) + Ollama Local (Fallback)
> - **Cloud Priority:** `LLM_PROVIDER=groq` with `GROQ_API_KEY`. Delivers sub-second latency critical for real-time conversation.
> - **Local Fallback:** If internet is down or Groq returns an error, the pipeline automatically shifts to local Ollama `Qwen3-8B` or rule-based persona responses with zero user interruption.

---

## Related Documentation
- [[02 - Architecture Overview]] — Data flow and component interaction.
- [[04 - Backend (FastAPI on M4)]] — Server orchestrator executing model tasks.
- [[06 - Data Model (Qdrant Schema)]] — Vector payload structure for matched entities.
- [[09 - Decisions Log]] — ADR #10 (Hybrid Cloud-First Architecture with Local Fallback).
