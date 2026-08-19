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
   - On-device ML Kit gating status (`GATED: ML_KIT_PASS`).
   - InsightFace 512-d embedding & Cosine Distance score (`0.9421`).
   - Active retained memory payload (Name, Relationship, Last Visit, Anecdotes, Favorite Songs).
   - Patient Voice Query Log table with Whisper STT transcript, LLM story response, and Piper TTS audio trigger.

2. **Tab 2: People & Biometrics Index:**
   - Table of registered individuals with Qdrant vector status (`512-D QDRANT INDEXED`).
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

## Design System: Vercel Geist Neutral Monochromatic Standard (Zero AI Slop)

> [!decision] Vercel Geist Grayscale Standard (ADR #4)
> Grounded in official Vercel Geist design system specifications, the Caregiver Portal strictly eliminates all colored accent text (such as artificial green status pills or blue decorative badges).
> 
> **Geist Visual Principles Applied:**
> - **Strict Grayscale Palette:** Pure dark canvas (`#0a0a0a`), surface cards (`#121212`), 1px solid dividers (`#262626`), near-white text (`#fafafa`), and neutral muted labels (`#737373`).
> - **Geist Typography:** `Geist` for UI text and `Geist Mono` for tabular vectors, IDs, timestamps, and data columns.
> - **Zero Slop Restraint:** 0 colorful text highlights or AI template glows. Status indicators rely on neutral grayscale badges (`#171717`).

---

## Related Documentation
- [[04 - Backend (FastAPI on M4)]] — REST API endpoints.
- [[06 - Data Model (Qdrant Schema)]] — Qdrant vector payload structure.
- [[09 - Decisions Log]] — ADR #4 (Vercel Geist Design System Standard).
