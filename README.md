# NeuroTwin

**NeuroTwin** is an AI-powered cognitive-companion system for patients with memory impairment (e.g., dementia), designed to assist with ambient person/object recognition and natural voice recall of personal memories, relationships, and shared history.

---

## 📚 Project Knowledge Base & Vault Index

This repository serves as a complete **Obsidian Vault** for NeuroTwin.

### 📍 Core Map of Content
- **[00 - MOC (Map of Content)](./NeuroTwin/00%20-%20MOC.md)** — Master overview and vault navigation index.
- **[Master Index](./index.md)** — Top-level Obsidian vault index.

### 🗂️ Knowledge Base Documents

#### 1. Product & Vision
* **[01 - Product Idea](./NeuroTwin/01%20-%20Product%20Idea.md)** — Core pitch, patient/caregiver personas, "Who is she?" walkthrough, and memory richness differentiator.
* **[07 - Caregiver App](./NeuroTwin/07%20-%20Caregiver%20App.md)** — Caregiver management interface, feature matrix, data write path, and platform strategy.
* **[10 - Privacy and Ethics](./NeuroTwin/10%20-%20Privacy%20and%20Ethics.md)** — Biometric sensitivity, consent models, data minimization, access control, and medical disclaimer.

#### 2. Architecture & Technical Design
* **[02 - Architecture Overview](./NeuroTwin/02%20-%20Architecture%20Overview.md)** — Data flow narrative, sequence diagram, and client-server processing split.
* **[03 - Mobile Client (Android)](./NeuroTwin/03%20-%20Mobile%20Client%20%28Android%29.md)** — Native Kotlin + Compose rationale, CameraX, ML Kit filter, permissions, and battery optimization.
* **[04 - Backend (FastAPI on M4)](./NeuroTwin/04%20-%20Backend%20%28FastAPI%20on%20M4%29.md)** — Server orchestrator, REST API endpoints, async design, and M4 resource allocation.
* **[05 - AI Pipeline](./NeuroTwin/05%20-%20AI%20Pipeline.md)** — Face recognition (InsightFace/FaceNet), object tracking (YOLO), Whisper STT, LLM persona, and TTS synthesis.
* **[06 - Data Model (Qdrant Schema)](./NeuroTwin/06%20-%20Data%20Model%20%28Qdrant%20Schema%29.md)** — Vector DB collection schemas (`people` & `objects`) and payload structures.
* **[08 - Tech Stack](./NeuroTwin/08%20-%20Tech%20Stack.md)** — Master component comparative table and hardware requirements.
* **[13 - Dev Environment and Tooling](./NeuroTwin/13%20-%20Dev%20Environment%20and%20Tooling.md)** — Workflow with Android Studio, `opencode`, Android-MCP, CLI, and macOS setup.

#### 3. Strategy & Planning
* **[09 - Decisions Log](./NeuroTwin/09%20-%20Decisions%20Log.md)** — Architecture Decision Records (ADRs) tracking key choices and technical rationales.
* **[11 - Build Roadmap](./NeuroTwin/11%20-%20Build%20Roadmap.md)** — 7-phase implementation roadmap from backend skeleton to hardening.
* **[12 - Open Questions](./NeuroTwin/12%20-%20Open%20Questions.md)** — Living list of active open trade-offs (Groq vs. Ollama, Caregiver UI platform, BLE tags, etc.).

#### 4. Reference & History
* **[14 - Glossary](./NeuroTwin/14%20-%20Glossary.md)** — Definitions of biometric vectors, Android primitives, ADRs, and RAG retrieval patterns.
* **[15 - Original Concept (Archived)](./NeuroTwin/15%20-%20Original%20Concept%20%28Archived%29.md)** — Historical Raspberry Pi 4 wearable design specifications and pivot rationale.
