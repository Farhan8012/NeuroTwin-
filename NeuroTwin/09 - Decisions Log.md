---
project: NeuroTwin
tags: [neurotwin, neurotwin/decision]
status: in-progress
created: 2026-08-19
updated: 2026-08-19
---

# Decisions Log

## Overview & Guidelines

This document logs all key Architectural Decision Records (ADRs) made during the design and development of NeuroTwin. Entries are listed in reverse chronological order (most recent first).

Future architectural decisions must follow the established format:
- **Date:** YYYY-MM-DD
- **Decision:** Concise summary title
- **Alternatives Considered:** Alternative technologies or approaches evaluated
- **Rationale:** Technical, operational, or practical justifications

---

## Architectural Decision Records

> [!decision] ADR #6: Senior Patient & Memory-Impaired Accessibility UI Standard
> **Date:** 2026-08-19  
> **Alternatives considered:** Technical developer dashboards with small fonts and dense metric tables as default view.  
> **Rationale:** The end-user operating the mobile device is an elderly patient with memory impairment. The UI defaults to **Senior Patient Mode**: 32px–36px bold headlines, 20px readable story text, 72px+ massive touch action buttons, large family photo cards, and zero technical jargon. Developer metrics and caregiver tables are relegated behind a toggleable Caregiver Mode.

> [!decision] ADR #5: FastAPI Backend Modular Router Architecture
> **Date:** 2026-08-19  
> **Alternatives considered:** Single monolith `main.py` script.  
> **Rationale:** Structuring the backend into modular APIRouters (`app/routers/health.py`, `frame.py`, `voice.py`, `people.py`) located under `backend/` decouples vision processing, STT/TTS voice synthesis, database CRUD, and health telemetry, simplifying maintenance and unit testing.

> [!decision] ADR #4: Caregiver Portal Platform — Web Application with Caregiver Toggle
> **Date:** 2026-08-19  
> **Alternatives considered:** Secondary Android UI screen mode inside patient app; separate native mobile app.  
> **Rationale:** A web dashboard accessible on desktop, tablet, or mobile browsers allows caregivers to comfortably type long memory stories, upload reference photos, and inspect real-time system logs. Designed with dual Patient/Caregiver mode toggle. Resolves Open Question #2.

> [!decision] ADR #3: Processing split: local pre-filter + server-side heavy AI
> **Date:** 2026-08-19  
> **Alternatives considered:** Stream everything raw to the backend continuously over HTTP/WebSockets.  
> **Rationale:** The M4 MacBook Air is a shared, resource-constrained host machine that is also running Ollama with Qwen3-8B. Filtering empty frames on-device using ML Kit saves network bandwidth, backend server compute, and phone battery life.

> [!decision] ADR #2: Client language: native Kotlin, not cross-platform
> **Date:** 2026-08-19  
> **Alternatives considered:** Flutter, React Native, Kotlin Multiplatform (KMP).  
> **Rationale:** CameraX image stream lifecycle handling, persistent Foreground Service execution, and native Bluetooth/`AudioManager` routing are exactly the primitives where cross-platform frameworks fight the underlying mobile operating system. Native Kotlin provides uninhibited API access and long-term stability.

> [!decision] ADR #1: Device: Raspberry Pi wearable → Android phone
> **Date:** 2026-08-19  
> **Alternatives considered:** Keep the original custom Raspberry Pi 4 wearable harness hardware design.  
> **Rationale:** Avoids custom hardware manufacturing, thermal throttling, and battery harness engineering. Leverages high-performance smartphones that patients or caregivers already own, dramatically accelerating iteration speed and lowering barrier to entry.

---

## Related Documentation
- [[01 - Product Idea]] — Senior accessibility guidelines.
- [[03 - Mobile Client (Android)]] — Native Compose UI implementation.
- [[07 - Caregiver App]] — Dual-mode Caregiver application.
