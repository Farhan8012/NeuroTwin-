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

The frontend ships as an **accessible dual-mode SPA**: a large-type **Patient Mode** (recognition card, ask-question voice loop with audio playback, memory reminders) and a **Caregiver Mode** (5-tab layout with People, Memories, Medicines, Emergency, and Telemetry panels). All panels call the live FastAPI backend:

1. **Patient Mode (default):**
   - Warm recognition hero card with active person context.
   - Big tap-to-ask voice loop (`POST /voice-query`) with generated Piper TTS audio playback.
   - Reassuring memory story cards.

2. **Caregiver Mode (5 tabs):**
   - **👥 People:** live table from `GET /people` with Qdrant vector status badges; `+ Add New Person` modal uploads a photo to `POST /people/with-photo` and indexes a 512-d InsightFace embedding; delete purges profile + vectors (right to be forgotten).
   - **🧠 Memories:** full CRUD for memory anchors (`GET/POST/DELETE /memories`); persistent JSON-backed storage via `json_store.py`.
   - **💊 Medicines:** full CRUD for medication schedule (`GET/POST/DELETE /medicines`); seeded with Donepezil and Memantine defaults.
   - **🚨 Emergency:** full CRUD for emergency contacts (`GET/POST/DELETE /emergency-contacts`); seeded with Sarah Varma and Dr. Thorne defaults.
   - **📊 Telemetry:** live M4 metrics from `GET /health` (Qdrant, Ollama, Whisper, Piper, CPU/memory, indexed vector counts) + Patient Voice Query Log.

---

## Design System: Senior Accessibility + Dark Theme

> [!decision] Senior Patient Accessibility Standard (ADR #4)
> The UI follows a strict senior-accessibility-first design with high-contrast dark theme.
> 
> **Visual Principles Applied:**
> - **72px Touch Targets:** All action buttons meet minimum 76px height for motor-impaired users.
> - **32px Headers:** Large type hierarchy for readability.
> - **Dark Canvas:** `#09090b` background with `#1c2030` card surfaces and `#fbbf24` gold accents for critical actions.
> - **Inter Font:** Clean sans-serif for maximum legibility.
> - **Caregiver Toggle:** Single button switches between Patient Mode (simple) and Caregiver Mode (5-tab management).

## BLE Beacon Integration

The caregiver portal supports registering BLE beacon tags for room-level object tracking:

1. Register a beacon with `object_class` (e.g., "reading_glasses") and attach it to a physical object.
2. Place fixed receiver beacons in rooms (Living Room, Kitchen, Bedroom, Hallway).
3. The mobile app scans for beacons and reports RSSI values to `POST /api/v1/ble/rssi`.
4. Backend triangulates room location using log-distance path loss model.
5. Object location appears in the Telemetry tab alongside visual detection data.

---

## Related Documentation
- [[04 - Backend (FastAPI on M4)]] — REST API endpoints.
- [[06 - Data Model (Qdrant Schema)]] — Qdrant vector payload structure.
- [[09 - Decisions Log]] — ADR #4 (Vercel Geist Design System Standard).
