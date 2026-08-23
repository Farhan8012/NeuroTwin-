---
project: NeuroTwin
tags: [neurotwin, neurotwin/open-question]
status: in-progress
created: 2026-08-19
updated: 2026-08-19
---

# Open Questions

## Overview

This note serves as the living source of truth for all unresolved design decisions, technical trade-offs, and open architecture questions in NeuroTwin. As decisions are resolved during building, they are migrated into [[09 - Decisions Log]].

---

## Resolved Questions

> [!note] RESOLVED — Question #1: LLM Hosting Strategy (Groq Cloud vs. Local Ollama)
> - **Resolution:** Implemented as a **Cloud-First Hybrid with Automatic Local Fallback**. Groq Llama 3.3 70B (`LLM_PROVIDER=groq`) operates as the primary engine for sub-second responses (~0.5s), with automatic failover to local Ollama (Qwen3-8B) and rule-based persona responses if cloud APIs are offline.
> - **ADR:** See [[09 - Decisions Log]] (ADR #10).

> [!note] RESOLVED — Question #2: Caregiver Interface Platform Strategy
> - **Resolution:** Implemented as an **ultra-minimalist, professional dark-mode Web Application** located in `web/` designed via Stitch MCP.
> - **ADR:** See [[09 - Decisions Log]] (ADR #4).

---

## Active Open Questions

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
