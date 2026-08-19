---
project: NeuroTwin
tags: [neurotwin, neurotwin/archive]
status: draft
created: 2026-08-19
updated: 2026-08-19
---

# Original Concept (Archived)

> [!note] Status: Archived / Superseded
> This document captures the initial, original hardware architecture for NeuroTwin, which was based on a custom wearable built around a Raspberry Pi 4.
> 
> **Notice:** This concept was officially **superseded on 2026-08-19** in favor of the current native Android smartphone + M4 MacBook Air architecture. It is preserved here for historical context so that the architectural reasoning behind the pivot is not lost.

---

## Initial Hardware Concept: Raspberry Pi Wearable

The initial design envisioned a custom wearable hardware rig worn by the patient:
- **Compute Unit:** Raspberry Pi 4 Model B (4GB or 8GB RAM).
- **Visual Capture:** Raspberry Pi Camera Module 2/3 attached to clothing or glasses.
- **Audio Input:** USB mini microphone lapel clip.
- **Audio Output:** Bluetooth wireless earbud or wearable neck speaker.
- **Power Supply:** External 5V/3A USB-C battery power bank harness.

---

## Original Software Component Stack

- **On-Device Coordinator:** Lightweight Python service on the Pi coordinating camera frames and mic recording.
- **Vision Models:** Server-side YOLO for object detection and InsightFace/FaceNet for face embeddings.
- **Vector Storage:** Qdrant instance for face and memory payload lookups.
- **Speech Recognition:** Whisper STT for transcribing voice queries.
- **Reasoning Engine:** Groq-hosted Llama 3 API (free tier) handling natural language generation.
- **Speech Synthesis:** Piper / Kokoro TTS for generating voice responses.
- **Backend Coordinator:** FastAPI application orchestrating services.
- **Caregiver Dashboard:** Standalone React single-page web application.

---

## Rationale for Pivoting Away from Raspberry Pi

As detailed in [[09 - Decisions Log]], the Raspberry Pi 4 wearable design was abandoned for three primary reasons:

1. **Hardware & Thermal Constraints:** The Pi 4 suffered from severe thermal throttling when handling continuous camera encoding and Bluetooth audio streaming simultaneously without heavy active cooling.
2. **Physical Ergonomics & Battery Harness:** Wearing a exposed Pi board, camera ribbon cable, battery bank, and thermal heatsink was unpractical, uncomfortable, and stigmatizing for dementia patients.
3. **Pervasive Device Ownership:** Android smartphones offer vastly superior camera hardware, native power management, integrated battery, built-in ML accelerators (NPUs), and robust Bluetooth stack—utilizing devices that patients or caregivers already own.

---

## Related Documentation
- [[08 - Tech Stack]] — Current native Android + M4 stack.
- [[09 - Decisions Log]] — Architecture decision record for the hardware pivot.
