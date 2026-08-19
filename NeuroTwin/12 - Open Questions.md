---
project: NeuroTwin
tags: [neurotwin, neurotwin/open-question]
status: draft
created: 2026-08-19
updated: 2026-08-19
---

# Open Questions

## Overview

This note serves as the living source of truth for all unresolved design decisions, technical trade-offs, and open architecture questions in NeuroTwin. As decisions are resolved during building, they will be migrated into [[09 - Decisions Log]].

---

## Active Open Questions

> [!question] 1. LLM Hosting Strategy: Groq Cloud API vs. Local Ollama Qwen3-8B
> - **Context:** Groq-hosted Llama 3 offers ultra-fast response times and free API access, offloading compute from the M4 server, but requires an active internet connection and sends data off-device. Local Ollama + Qwen3-8B running on the M4 keeps all data 100% private on the local LAN, but competes directly for RAM, CPU, and GPU resources with Qdrant, InsightFace, YOLO, Whisper, and TTS.
> - **Action Item:** Benchmark both approaches under full concurrent pipeline load once the backend skeleton is complete.
> - **Cross-Reference:** [[05 - AI Pipeline]], [[04 - Backend (FastAPI on M4)]]

> [!question] 2. Caregiver Interface Platform Strategy
> - **Context:** Options include a standalone React web dashboard (the original plan), a secondary mode/screen within the primary Android patient application, or a separate lightweight companion Android app.
> - **Action Item:** Revisit once the core patient-facing capture and voice retrieval loop is functional.
> - **Cross-Reference:** [[07 - Caregiver App]], [[03 - Mobile Client (Android)]]

> [!question] 3. BLE Tags for Physical Object Tracking
> - **Context:** In addition to visual object detection (YOLO), incorporating physical Bluetooth Low Energy (BLE) beacon tags could provide precise indoor triangulation for misplaced items like keys or wallets.
> - **Action Item:** Evaluate feasibility of integrating Android BLE scanning alongside CameraX visual tracking.
> - **Cross-Reference:** [[06 - Data Model (Qdrant Schema)]], [[15 - Original Concept (Archived)]]

> [!question] 4. Network Topology: Local LAN vs. Remote WireGuard Tunnel
> - **Context:** Should the system operate strictly over local home Wi-Fi, or should the M4 backend be exposed via an encrypted WireGuard VPN tunnel (or Tailscale) to support the patient when away from home?
> - **Action Item:** Assess security, latency, and connectivity requirements for out-of-home use.
> - **Cross-Reference:** [[03 - Mobile Client (Android)]], [[10 - Privacy and Ethics]]

> [!question] 5. On-Device Face Embeddings (TFLite) vs. Server-Only Execution
> - **Context:** Is it worth moving face embedding generation to an on-device TensorFlow Lite (TFLite) model to enable basic offline face identification, or should embedding generation remain strictly server-side on the M4?
> - **Action Item:** Test TFLite face embedding accuracy and battery consumption on target Android hardware.
> - **Cross-Reference:** [[03 - Mobile Client (Android)]], [[05 - AI Pipeline]]

---

## Related Documentation
- [[05 - AI Pipeline]] — Detailed AI models and pipeline configuration.
- [[07 - Caregiver App]] — Caregiver interface specifications.
- [[09 - Decisions Log]] — Log of resolved architectural choices.
