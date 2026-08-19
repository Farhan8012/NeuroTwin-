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

## Full Feature Matrix

1. **Family & Friend Profile Management:**
   - Add, edit, or remove registered individuals.
   - Upload high-resolution reference photos for initial face embedding extraction.
   - Define exact relationship labels (e.g., *"Daughter"*, *"Primary Care Physician"*, *"Neighbor"*).

2. **Memory & Story Management:**
   - Log important life events, family stories, and personal anecdotes.
   - Upload favorite songs, music playlists, favorite places, and personal hobbies.
   - Record and attach audio voice notes from family members.

3. **Medical & Emergency Management:**
   - Maintain active medication schedules and dosage context.
   - Manage emergency contacts and primary physician details.

4. **Interaction Log & Telemetry Review:**
   - Review recent patient interaction history (e.g., face detection logs, patient voice questions, AI responses).
   - Flag incorrect face matches or misidentified relationship responses for retraining/updating.

---

## Caregiver Data Write Path

When a caregiver enters new information via the app, the data flows through the following pipeline:

```
[ Caregiver Uploads Photo & Story ]
              │
              ▼
[ FastAPI Backend Endpoint POST /people ]
              │
              ▼
[ InsightFace Generates 512-d Embedding ]
              │
              ▼
[ Qdrant Indexing: Store Vector + Payload ]
              │
              ▼
[ Context Active for Patient Retrieval ]
```

1. **Input:** Caregiver uploads 3–5 reference photos of a family member along with textual stories and relationship info.
2. **Server Execution:** FastAPI passes uploaded images to InsightFace, generating normalized 512-d embeddings.
3. **Storage:** The vector embeddings and associated payload are indexed into Qdrant.
4. **Availability:** Context becomes immediately available for real-time patient recognition and LLM memory retrieval.

---

## Interface Platform & Design System

> [!decision] Resolved Platform & Design Selection
> As recorded in [[09 - Decisions Log]] (ADR #4), the Caregiver Portal is implemented as an **ultra-minimalist, professional dark-mode Web Application** located in the `web/` directory.
> 
> **Stitch MCP UI Prototype:** Designed using Stitch MCP with a strict monochrome palette (`#0b0d12` canvas, `#12151e` panels, `#242936` hairline borders, `Inter` / `JetBrains Mono` typography). The UI eliminates flashiness to ensure clear, high-density instrumentation.

---

## Related Documentation
- [[04 - Backend (FastAPI on M4)]] — REST API CRUD endpoints supporting the app.
- [[06 - Data Model (Qdrant Schema)]] — Payload fields managed by the caregiver interface.
- [[09 - Decisions Log]] — Architecture decision record resolving platform strategy.
