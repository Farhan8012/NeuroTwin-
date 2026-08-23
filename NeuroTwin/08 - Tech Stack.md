---
project: NeuroTwin
tags: [neurotwin, neurotwin/tech-stack]
status: draft
created: 2026-08-19
updated: 2026-08-19
---

# Tech Stack

## System Components Summary Table

The table below outlines the end-to-end technology stack powering NeuroTwin under the **Cloud-First with Local Fallback** design (superseding the original Raspberry Pi wearable concept in [[15 - Original Concept (Archived)]]).

| Layer | Component | 1st Priority (Cloud API) | Backup Fallback (Local M4) | Rationale & Architectural Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Mobile Client** | Application Framework | **Kotlin + Jetpack Compose** | **Kotlin + Jetpack Compose** | Native Android execution for direct access to CameraX, Foreground Services, and Bluetooth audio. |
| **Local Pre-Filter** | On-Device CV Gating | **Google ML Kit** | **Google ML Kit** | Discards empty frames locally to conserve bandwidth and device battery. |
| **Backend Orchestrator** | Web / API Server | **FastAPI** (Python 3.11+) | **FastAPI** (Python 3.11+) | Async orchestrator managing cloud dispatch, fallback routing, context caching, and CRUD. |
| **Vector Memory** | Vector Database | **Qdrant Cloud** (Managed Free) | **Native Qdrant** (port 6333) | 512-d face vectors and object location logs indexed via Cosine distance. |
| **Face Recognition** | Facial Feature Extraction | **InsightFace `buffalo_l`** | **InsightFace `buffalo_l`** | Runs on CPU/GPU to generate normalized 512-d embeddings from camera frames. |
| **Object Detection** | Household Object CV | **Google ML Kit** (on mobile) | **YOLOv8-nano** (Server) | Identifies personal items (glasses, keys, bottles) with timestamps and room locations. |
| **Speech-to-Text** | Audio Transcription | **Groq Whisper** (large-v3) | **faster-whisper** (base int8 CPU) | Transcribes patient spoken questions with sub-second turnaround. |
| **LLM Reasoning** | Language Companion | **Groq Llama 3.3 70B** (~0.5s) | **Ollama Qwen3-8B** (~15-25s) | Generates warm, comforting, memory-grounded responses for the patient. |
| **Text-to-Speech** | Voice Synthesis | **Google Cloud / Azure TTS** | **Piper TTS** (en_US-lessac) | Synthesizes natural companion speech delivered to patient's Bluetooth earbud. |
| **Caregiver Portal** | Management UI | **Modern Dark-Mode Web App** | **Modern Dark-Mode Web App** | Single-page app in `web/` with Patient Mode and 5-tab Caregiver management. |
| **Relational Mirror** | Persistent Cloud DB | **Supabase Postgres** | **Local JSON Store** (`data/*.json`) | Write-through persistence for profiles, memories, meds, and emergency contacts. |

---

## Key Hardware & Deployment Requirements

- **Patient Hardware:** Modern Android Smartphone (Android 10+, API 29+) with CameraX, Bluetooth 5.0+, and internet/Wi-Fi connection + Bluetooth wireless earbud or wearable speaker.
- **Server Deployment Options:**
  - **Cloud Mode (Primary):** Any lightweight cloud container (Render, Railway, Fly.io, or VPS) with Python 3.11+ running FastAPI.
  - **Local Host (Fallback):** Apple MacBook Air (M4 chip, 16GB RAM) or local Windows/Linux machine running FastAPI, native Qdrant, and Ollama.

---

## Related Documentation
- [[02 - Architecture Overview]] — Data flow narrative and sequence diagram.
- [[04 - Backend (FastAPI on M4)]] — FastAPI backend specifications.
- [[05 - AI Pipeline]] — Detailed AI models and cloud/local fallback tiers.
- [[09 - Decisions Log]] — ADR #10 (Hybrid Cloud-First Architecture with Local Fallback).
