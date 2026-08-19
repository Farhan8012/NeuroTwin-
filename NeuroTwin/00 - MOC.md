---
project: NeuroTwin
tags: [neurotwin, neurotwin/moc]
status: in-progress
created: 2026-08-19
updated: 2026-08-19
---

# Map of Content (MOC) — NeuroTwin

**NeuroTwin** is an AI-powered cognitive companion designed for patients with memory impairment (such as dementia), helping them recognize people and objects in their surroundings and recall relationships and shared history naturally through warm, real-time voice interactions. Powered by a native Android mobile client performing lightweight on-device pre-filtering (ML Kit) and a robust FastAPI backend on an M4 MacBook Air executing heavy AI processing (InsightFace, Qdrant vector search, Whisper STT, LLM reasoning, and Piper/Kokoro TTS), NeuroTwin restores personal context to the patient while empowering caregivers via a comprehensive management layer.

---

## Vault Knowledge Outline

### Product
- [[01 - Product Idea]] — Pitch, target users (patient + caregiver), end-to-end interaction walkthrough, and core memory differentiator.
- [[07 - Caregiver App]] — Caregiver management interface, feature matrix, data write path, and minimalist web platform design.
- [[10 - Privacy and Ethics]] — Biometric sensitivity, consent models, data minimization, access control, and medical device disclaimers.

### Architecture & Build
- [[02 - Architecture Overview]] — Data flow narrative, sequence diagram, and core architectural principles.
- [[03 - Mobile Client (Android)]] — Native Kotlin + Compose rationale, CameraX frame gating, permissions, networking, and battery optimization.
- [[04 - Backend (FastAPI on M4)]] — Server role, REST API endpoints, directory architecture, and M4 resource allocation.
- [[05 - AI Pipeline]] — Face recognition, YOLO object detection, Whisper STT, LLM prompt engineering, and TTS synthesis.
- [[06 - Data Model (Qdrant Schema)]] — Vector DB collections (`people` and `objects`), payload structures, and indexing strategy.
- [[08 - Tech Stack]] — Master component comparative breakdown and hardware requirements.
- [[13 - Dev Environment and Tooling]] — Development loop, MCP server tools (Android-MCP, IDE plugin, Obsidian, Stitch), and macOS host setup.

### Planning
- [[09 - Decisions Log]] — Architecture Decision Records (ADRs) tracking core choices, alternatives, and rationale.
- [[11 - Build Roadmap]] — Phased implementation plan from backend skeleton to security hardening.
- [[12 - Open Questions]] — Running list of unresolved technical trade-offs and decision criteria.

### Reference
- [[14 - Glossary]] — Definitions of core concepts, biometric vectors, Android primitives, and RAG retrieval patterns.
- [[15 - Original Concept (Archived)]] — Historical Raspberry Pi 4 wearable hardware design and pivot rationale.

---

## Vault Note Status Index

| Note Title | Category | Status |
| :--- | :--- | :--- |
| [[00 - MOC]] | Index | `in-progress` |
| [[01 - Product Idea]] | Product | `draft` |
| [[02 - Architecture Overview]] | Architecture | `draft` |
| [[03 - Mobile Client (Android)]] | Mobile | `draft` |
| [[04 - Backend (FastAPI on M4)]] | Backend | `in-progress` |
| [[05 - AI Pipeline]] | AI / ML | `draft` |
| [[06 - Data Model (Qdrant Schema)]] | Data Model | `draft` |
| [[07 - Caregiver App]] | Caregiver | `in-progress` |
| [[08 - Tech Stack]] | Architecture | `draft` |
| [[09 - Decisions Log]] | Planning | `in-progress` |
| [[10 - Privacy and Ethics]] | Product / Ethics | `draft` |
| [[11 - Build Roadmap]] | Planning | `in-progress` |
| [[12 - Open Questions]] | Planning | `in-progress` |
| [[13 - Dev Environment and Tooling]] | Dev Tooling | `draft` |
| [[14 - Glossary]] | Reference | `draft` |
| [[15 - Original Concept (Archived)]] | Reference | `draft` |
