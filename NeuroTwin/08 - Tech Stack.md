---
project: NeuroTwin
tags: [neurotwin, neurotwin/tech-stack]
status: draft
created: 2026-08-19
updated: 2026-08-19
---

# Tech Stack

## System Components Summary Table

The table below outlines the end-to-end technology stack powering NeuroTwin. Note that this architecture **supersedes** the original Raspberry Pi 4 wearable concept documented in [[15 - Original Concept (Archived)]].

| Layer | Component | Technical Selection | Rationale & Architectural Notes |
| :--- | :--- | :--- | :--- |
| **Mobile Client** | Application Framework | **Kotlin + Jetpack Compose** | Native Android execution for direct hardware access to CameraX, Foreground Services, and native Bluetooth audio routing APIs. |
| **Local Pre-Filter** | On-Device Computer Vision | **Google ML Kit** (Face & Object Detection) | Evaluates frames locally on-device as a cheap gating filter. Discards empty frames before network upload to conserve battery and compute. |
| **Backend Orchestrator** | REST / WebSocket Server | **FastAPI** (Python 3.11+) | Async orchestrator running on host machine. Coordinates CV models, Qdrant lookups, LLM context, and TTS audio delivery. |
| **Vector Memory** | Vector Database | **Qdrant** | High-performance vector engine storing 512-d face embeddings and memory payloads. Cosine similarity indexing. |
| **Face Recognition** | Server-side CV Embedding | **InsightFace / FaceNet** | Generates 512-dimensional face embeddings from uploaded gated frames. |
| **Object Detection** | Server-side CV Model | **YOLO (v8/v9)** | Identifies patient belongings (glasses, keys, pill bottles) and tracks last-seen timestamps and locations. |
| **Speech-to-Text (STT)** | Speech Recognition | **OpenAI Whisper** | Server-side audio transcription (`faster-whisper` / C++ bindings) converting microphone voice clips to text. |
| **LLM Engine** | Language Model Reasoning | **Groq Llama 3 API** OR **Local Ollama (Qwen3-8B)** | *Open decision — see [[05 - AI Pipeline]].* Offloaded cloud inference vs. local M4 execution. |
| **Text-to-Speech (TTS)** | Voice Synthesis | **Piper / Kokoro TTS** | Low-latency local neural speech synthesis streaming audio to mobile Bluetooth earpiece. |
| **Caregiver Interface** | Management Interface | **React (Web)** OR **Android UI Mode** | *Open decision — see [[07 - Caregiver App]].* Web dashboard vs. mobile companion screen. |

---

## Key Hardware Requirements

- **Patient Hardware:** Modern Android Smartphone (Android 10+, API Level 29+) with high-resolution camera, Bluetooth 5.0+, and persistent cellular/Wi-Fi connection + Bluetooth wireless earbud or wearable speaker.
- **Server Hardware:** Apple MacBook Air (M4 chip, 16GB+ Unified Memory) running macOS, Docker (for Qdrant container), Python 3.11+, and Ollama runtime.

---

## Related Documentation
- [[02 - Architecture Overview]] — Data flow narrative.
- [[09 - Decisions Log]] — Architecture decision records explaining tech stack choices.
- [[15 - Original Concept (Archived)]] — Historical Raspberry Pi 4 stack.
