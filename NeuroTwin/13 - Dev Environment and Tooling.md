---
project: NeuroTwin
tags: [neurotwin, neurotwin/tooling]
status: draft
created: 2026-08-19
updated: 2026-08-19
---

# Dev Environment and Tooling

## Developer Workflow Overview

The primary development workflow pairs **Android Studio** and **opencode** as the core interactive coding loop. Development is split across mobile client construction (Android) and backend server orchestration (Python / macOS).

---

## Model Context Protocol (MCP) Integration

NeuroTwin leverages specialized MCP servers to streamline testing, IDE intelligence, and knowledge management:

1. **Android-MCP Server:**
   - Provides direct ADB device control and automation.
   - Configured via `opencode.json` for launching tasks, inspecting logcat output, taking device screenshots, and performing automated UI input testing directly on physical test devices or Android emulators.

2. **Android Studio IDE MCP Plugin:**
   - Delivers IDE-level code intelligence, AST symbol navigation, automated refactoring, and lint feedback directly to opencode.

3. **Android CLI Tooling:**
   - Powers terminal-level build scripts (`./gradlew assembleDebug`), scaffolding, dependency resolution, and automated APK deployment.

4. **Obsidian Vault Maintenance:**
   - Manages and maintains this project vault as the living single source of truth for architectural decisions, schemas, roadmaps, and documentation.

---

## Development Machine Environment

- **Host Hardware:** Apple MacBook Air (M4 chip, 16GB unified memory, macOS).
- **Backend Runtime:** Python 3.12 via `uv` virtualenv at `backend/.venv`, Uvicorn + FastAPI on port `8000`.
- **Database Service:** Native Qdrant 1.19 binary at `backend/qdrant/bin/qdrant` (port `6333`) — no Docker daemon required (see ADR #7).
- **Local AI Services:** Model weights bundled in `backend/models/` — InsightFace `buffalo_l`, faster-whisper `base`, Piper `en_US-lessac-medium`.
- **LLM:** Existing Ollama instance serving `Qwen3-8B` (default), Groq Llama 3 via `LLM_PROVIDER=groq` + `GROQ_API_KEY`.

> [!note] M4 Resource Sharing Notice
> Because the M4 MacBook Air hosts both the backend AI models (InsightFace, Whisper, Piper, Qdrant) and the existing Ollama LLM workload, developers should monitor Unified Memory usage and thermal performance during full-stack integration testing. Startup commands are documented in `backend/README.md`.

---

## Related Documentation
- [[03 - Mobile Client (Android)]] — Android application specifications.
- [[04 - Backend (FastAPI on M4)]] — FastAPI backend environment.
- [[08 - Tech Stack]] — End-to-end component breakdown.
