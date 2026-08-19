---
project: NeuroTwin
tags: [neurotwin, neurotwin/caregiver]
status: in-progress
created: 2026-08-19
updated: 2026-08-19
---

# Caregiver App

## Role & Value Proposition

The **Caregiver Companion Application** serves as the primary management layer for NeuroTwin. While the patient interacts passively and conversationally via voice and earpiece, the caregiver uses this interface to configure, populate, and monitor the patient's personal knowledge base.

Without the caregiver's input, the AI lacks the context required to transform facial recognition matches into meaningful, comforting memories.

---

## 5 Core Application Domains (Implemented in `web/`)

1. **Tab 1: Ambient Vision & Speech Monitor:**
   - Real-time CameraX video frame stream canvas.
   - On-device ML Kit gating status (`FACE_DETECTED` pass-through indicator).
   - Live InsightFace 512-d embedding & Qdrant Cosine Similarity score (`0.9421`).
   - Active retained memory payload (Name, Relationship, Last Visit, Anecdotes, Favorite Songs).
   - Patient Voice Query Log table with Whisper STT transcript, LLM story response, and Piper TTS audio trigger.

2. **Tab 2: People & Biometrics Index:**
   - Table of registered individuals with Qdrant vector status (`512-d INDEXED`).
   - Modal form (`+ Register New Person`) to upload photos and index new vectors into Qdrant.

3. **Tab 3: Memory Anchors & Story Repository:**
   - Categorized stories (Life Events, Anecdotes, Favorite Songs, Favorite Places, Hobbies).
   - Form modal (`+ Log New Memory Anchor`).

4. **Tab 4: Medical & Emergency Care Directory:**
   - Active medication schedule table (Medication Name, Dosage, Schedule Time, Instructions).
   - Emergency contact directory with primary contact badges.

5. **Tab 5: System Telemetry & Hardware Infrastructure:**
   - Host metrics for Apple M4 MacBook Air (FastAPI worker, Qdrant vector DB status, Ollama Qwen3-8B memory usage, model inference latency breakdowns).

---

## Design System: Stark Engineering Minimalism (Zero AI Slop)

> [!decision] Linear / Vercel Dark Design System (ADR #4)
> The Caregiver Portal intentionally rejects bloated cards, glassmorphism, decorative gradient glows, and AI boilerplate template slop.
> 
> **Design Specifications:**
> - **Canvas & Panels:** Pure dark zinc background (`#09090b`), surface panels (`#121215`), 1px hairline dividers (`#27272a`).
> - **Typography:** High-contrast zinc typography (`Inter` for UI, `JetBrains Mono` for tabular vectors/IDs/timestamps).
> - **Instrumentation:** Sparse layout with dense tabular alignment, monospace data keys, and active green dot status indicators (`#22c55e`).

---

## Related Documentation
- [[04 - Backend (FastAPI on M4)]] — REST API endpoints.
- [[06 - Data Model (Qdrant Schema)]] — Qdrant vector payload structure.
- [[09 - Decisions Log]] — ADR #4 (Stark Web Design System).
