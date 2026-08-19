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
   - **InsightFace** (or FaceNet) normalizes alignment and crops the facial ROI, generating a 512-dimensional floating-point feature vector.
2. **Vector Similarity Query:**
   - The vector is queried against Qdrant's `people` collection using **Cosine Similarity**.
3. **Thresholding & Matching:**
   - Match criteria: Similarity score $\ge 0.90 \text{ to } 0.96$.
   - **Above Threshold:** Returns person payload (`name`, `relationship`, `birthday`, `memories`, `family_stories`).
   - **Below Threshold:** Categorized as "Unknown Person". Prompts system to optionally offer caregiver notification or warm generic response.

---

## 2. Object Recognition Flow

1. **YOLO Detection:**
   - For object queries (e.g., *"Where are my glasses?"* or *"Where did I put my keys?"*), frames are passed through **YOLO** (YOLOv8/v9).
2. **Spatial & Temporal Tracking:**
   - When key items (glasses, keys, wallet, pill bottle) are detected in frames, the backend logs the detected class, bounding box, timestamp, and room/environmental context.
3. **Retrieval Strategy:**
   - When a patient asks about an object's location, the system fetches the most recent logged location record for that object class.

---

## 3. Voice Processing & Conversational Flow

1. **Speech-to-Text (Whisper):**
   - Spoken audio from the mobile microphone is transcribed using **OpenAI Whisper** (running locally on server via `faster-whisper` or metal-accelerated C++ bindings).
2. **Context Bundle Assembly:**
   - The transcript is merged with active visual context and retrieved person memories into a structured LLM prompt.
3. **Language Model Reasoning:**
   - The assembled context is processed by the selected LLM to produce a response.
4. **Text-to-Speech Synthesis (Piper / Kokoro):**
   - The response text is synthesized using **Piper** or **Kokoro TTS**, producing warm, natural-sounding audio streams sent back to the patient's Bluetooth earpiece.

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
