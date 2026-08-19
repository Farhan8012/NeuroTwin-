---
project: NeuroTwin
tags: [neurotwin, neurotwin/product]
status: in-progress
created: 2026-08-19
updated: 2026-08-19
---

# Product Idea

## Overview & Pitch

**NeuroTwin** is an AI-powered cognitive companion designed specifically for individuals experiencing memory impairment, such as dementia or early-stage Alzheimer's disease. The core objective of NeuroTwin is to help patients naturally recognize people and objects in their immediate environment, enabling them to recall personal relationships, shared histories, and daily items through warm, conversational voice interactions.

Rather than acting as a cold, clinical facial-recognition utility or a complex developer dashboard, NeuroTwin serves as an external memory extension—restoring context and emotional familiarity to the patient in real time.

---

## Senior Patient Accessibility Principles (Core UX Pillar)

Because the mobile client is operated directly by elderly patients experiencing cognitive decline, the interface is designed around strict accessibility guidelines:

- **Ultra-Large Readable Typography:** Headlines use 36px bold text; story descriptions use 18px–20px readable text with generous line heights.
- **Massive Touch Targets:** Primary action buttons are built with **72px+ height** for easy tapping by aging or trembling hands.
- **Zero Technical Clutter:** All developer metrics, vector IDs, latency scores, and model names are strictly hidden behind a subtle Caregiver Mode toggle.
- **Warm Reassuring Tone:** Responses are framed as comforting personal memories (e.g., *"This is your daughter Sarah. She visited you yesterday and brought blueberry muffins."*).

---

## Target Users

1. **The Patient (Primary End-User):** 
   - Experiences memory loss or difficulty recognizing faces and daily items.
   - Interacts via the Senior Companion UI featuring big family photo cards, 1-tap voice queries, and earpiece audio playback.

2. **The Caregiver (Secondary User & System Manager):**
   - Family member or nurse who toggles Caregiver Mode to manage profiles, upload reference photos, log stories, and track medical schedules.

---

## End-to-End Interaction Walkthrough: "Who is she?"

```
[ Camera Observes ] ──> [ ML Kit Filter ] ──> [ Frame Uploaded ]
                                                    │
[ Bluetooth Earbud ] <── [ TTS Speech ] <── [ LLM Response ] <── [ Qdrant Memory Match ]
```

1. **Continuous Passive Observation:** CameraX captures video frames continuously at 1.5 fps. Empty frames are discarded locally on-device.
2. **Visual Detection & Embedding:** When a face is detected, the frame is uploaded to FastAPI where InsightFace generates a 512-d embedding.
3. **Vector Database Lookup:** Qdrant matches the embedding, returning Sarah Varma's payload (relationship, memories, favorite songs).
4. **Patient Interface Display:** The mobile client immediately displays a large, comforting card: **"This is your daughter Sarah"** with her photo and recent visit notes.
5. **Patient Voice Query:** Patient taps the massive 72px mic button: *"Who is she?"*
6. **Voice Synthesis & Playback:** Whisper transcribes the audio, LLM composes a warm response, and Piper TTS plays the speech into the earpiece.

---

## Core Differentiator: Rich Memory vs. Bare Face Identification

> [!important] Protecting the Product Vision
> NeuroTwin must **never** degrade into a simple face-identification app that merely announces names (e.g., *"Detected: Sarah Varma"*).

The fundamental value proposition of NeuroTwin lies in the **richness and depth of the context stored per person**:
- **Life Events & Shared Stories:** Reminders of past trips, family milestones, and meaningful anecdotes.
- **Auditory & Emotional Anchors:** Favorite songs, voice notes from relatives, and personal hobbies.
- **Relational Context:** Explanations of how a person fits into the patient's family tree.

---

## Related Documentation
- [[02 - Architecture Overview]] — Technical data flow and system component interaction.
- [[03 - Mobile Client (Android)]] — Accessible senior UI implementation.
- [[10 - Privacy and Ethics]] — Biometric sensitivity, consent models, and data protection guidelines.
