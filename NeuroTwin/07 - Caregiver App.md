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

## Implemented in `web/`

The frontend ships as an **accessible dual-mode SPA**: a large-type **Patient Mode** (recognition card, ask-question voice loop with audio playback, memory reminders) and a **Caregiver Mode** (people registry with photo upload → Qdrant vector indexing, delete/purge, live system telemetry, and voice-query log). All panels call the live FastAPI backend:

1. **Patient Mode (default):**
   - Warm recognition hero card with active person context.
   - Big tap-to-ask voice loop (`POST /voice-query`) with generated Piper TTS audio playback.
   - Reassuring memory story cards.

2. **Caregiver Mode:**
   - **People & Biometrics:** live table from `GET /people` with Qdrant vector status badges; `+ Add New Person` modal uploads a photo to `POST /people/with-photo` and indexes a 512-d InsightFace embedding; delete purges profile + vectors (right to be forgotten).
   - **System Telemetry:** live M4 metrics from `GET /health` (Qdrant, Ollama, Whisper, Piper, CPU/memory, indexed vector counts).
   - **Voice Query Log:** running history of patient questions and companion responses.

The original 5-tab (Ambient Monitor / People / Memories / Medical / Telemetry) caregiver layout remains the target for the remaining CRUD panels (Memory Anchors, Medications, Emergency Contacts).

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
