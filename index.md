---
project: NeuroTwin
tags: [neurotwin, neurotwin/index]
status: in-progress
created: 2026-08-19
updated: 2026-08-19
---

# NeuroTwin — Master Index

Welcome to the **NeuroTwin** Obsidian Vault & Project Knowledge Base. 

NeuroTwin is an AI-powered cognitive companion for patients with memory impairment (e.g., dementia), designed to assist with ambient person/object recognition and natural voice recall of personal memories, relationships, and shared history.

---

## 📍 Central Map of Content
- **[[00 - MOC|00 - MOC (Map of Content)]]** — Master overview and vault navigation index.

---

## 🗂️ Complete Knowledge Base Index

### 1. Product & Vision
* **[[01 - Product Idea]]** — Core pitch, patient and caregiver personas, end-to-end "Who is she?" walkthrough, memory richness differentiator.
* **[[07 - Caregiver App]]** — Caregiver management interface, feature matrix, profile/story write path, and minimalist web platform design (`web/`).
* **[[10 - Privacy and Ethics]]** — Biometric data sensitivity, proxy consent flows, data minimization, access security, and medical device disclaimer.

### 2. Architecture & Technical Design
* **[[02 - Architecture Overview]]** — End-to-end data flow narrative, sequence diagram, and client-server processing split.
* **[[03 - Mobile Client (Android)]]** — Native Kotlin + Jetpack Compose rationale, CameraX frame gating, ML Kit filters, permissions, and battery optimization (`mobile/`).
* **[[04 - Backend (FastAPI on M4)]]** — Server orchestrator role, REST API endpoint sketch, directory architecture (`backend/`), and M4 hardware resource allocation.
* **[[05 - AI Pipeline]]** — Face recognition (InsightFace/FaceNet), object tracking (YOLO), speech-to-text (Whisper), LLM persona engineering, and TTS synthesis.
* **[[06 - Data Model (Qdrant Schema)]]** — Qdrant vector database schemas for `people` (512-d embeddings + payload) and `objects` location logs.
* **[[08 - Tech Stack]]** — Master technical stack summary table, comparative hardware requirements, and component choices.
* **[[13 - Dev Environment and Tooling]]** — Developer workflow with Android Studio, `opencode`, Android-MCP, CLI build scripts, Obsidian, and Stitch MCP.

### 3. Project Strategy & Planning
* **[[09 - Decisions Log]]** — Architecture Decision Records (ADRs) tracking key technical choices, alternatives, and rationales (ADR #1 to ADR #5).
* **[[11 - Build Roadmap]]** — 7-phase execution roadmap from initial backend skeleton through security and battery hardening.
* **[[12 - Open Questions]]** — Living list of active technical trade-offs (Groq vs. Ollama, BLE tags, WireGuard VPN topology, TFLite embeddings).

### 4. Reference & Archives
* **[[14 - Glossary]]** — Definitions of core terms, biometric vector concepts, Android primitives, and RAG retrieval patterns.
* **[[15 - Original Concept (Archived)]]** — Historical Raspberry Pi 4 wearable design specifications and pivot rationale.

---

## 📊 Master Vault Note Matrix

| # | Note Title | Domain | Status |
| :--- | :--- | :--- | :--- |
| 00 | [[00 - MOC]] | Index | `in-progress` |
| 01 | [[01 - Product Idea]] | Product | `draft` |
| 02 | [[02 - Architecture Overview]] | Architecture | `draft` |
| 03 | [[03 - Mobile Client (Android)]] | Mobile | `in-progress` |
| 04 | [[04 - Backend (FastAPI on M4)]] | Backend | `in-progress` |
| 05 | [[05 - AI Pipeline]] | AI Pipeline | `draft` |
| 06 | [[06 - Data Model (Qdrant Schema)]] | Data Model | `draft` |
| 07 | [[07 - Caregiver App]] | Caregiver | `in-progress` |
| 08 | [[08 - Tech Stack]] | Stack | `draft` |
| 09 | [[09 - Decisions Log]] | ADR | `in-progress` |
| 10 | [[10 - Privacy and Ethics]] | Ethics | `draft` |
| 11 | [[11 - Build Roadmap]] | Planning | `in-progress` |
| 12 | [[12 - Open Questions]] | Planning | `in-progress` |
| 13 | [[13 - Dev Environment and Tooling]] | Tooling | `draft` |
| 14 | [[14 - Glossary]] | Reference | `draft` |
| 15 | [[15 - Original Concept (Archived)]] | Archive | `draft` |
