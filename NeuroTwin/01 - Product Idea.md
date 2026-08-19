---
project: NeuroTwin
tags: [neurotwin, neurotwin/product]
status: draft
created: 2026-08-19
updated: 2026-08-19
---

# Product Idea

## Overview & Pitch

**NeuroTwin** is an AI-powered cognitive companion designed specifically for individuals experiencing memory impairment, such as dementia or early-stage Alzheimer's disease. The core objective of NeuroTwin is to help patients naturally recognize people and objects in their immediate environment, enabling them to recall personal relationships, shared histories, and daily items through warm, conversational voice interactions.

Rather than acting as a cold, clinical facial-recognition utility or a database lookup tool, NeuroTwin serves as an external memory extension—restoring context and emotional familiarity to the patient in real time.

---

## Target Users

NeuroTwin serves two primary user personas who work in tandem:

1. **The Patient (Primary End-User):** 
   - Experiences short-term or progressive memory loss, difficulty recognizing familiar faces, and trouble locating personal belongings (e.g., glasses, keys).
   - Interacts with the system purely via natural voice and ambient vision through a wearable Bluetooth earbud/speaker and smartphone camera.
   - Requires passive, non-intrusive support that preserves dignity and reduces anxiety during social interactions.

2. **The Caregiver (Secondary User & System Manager):**
   - Family member, nurse, or professional caretaker responsible for the patient's daily care and well-being.
   - Interacts via the Caregiver Companion Interface to manage profiles, register family members, upload photos, record family stories, schedule medications, and configure emergency contacts.
   - Seeds the knowledge graph and vector database with rich context that powers the AI's personalized responses.

---

## End-to-End Interaction Walkthrough: "Who is she?"

To understand how NeuroTwin operates in practice, consider a typical scenario:

```
[ Camera Observes ] ──> [ ML Kit Filter ] ──> [ Frame Uploaded ]
                                                    │
[ Bluetooth Earbud ] <── [ TTS Speech ] <── [ LLM Response ] <── [ Qdrant Memory Match ]
```

1. **Continuous Passive Observation:**
   - The camera on the patient's mobile client continuously monitors the environment at a controlled rate (e.g., 1–2 fps).
   - Video frames are evaluated locally on-device. Empty or irrelevant frames are immediately discarded without being stored or transmitted.

2. **Visual Detection & Embedding:**
   - A visitor enters the room. The local ML Kit pre-filter detects a human face in the video frame.
   - The gated frame is securely sent to the FastAPI backend on the M4 MacBook Air, where InsightFace generates a 512-dimensional face embedding.

3. **Vector Database Lookup:**
   - The face embedding is queried against the Qdrant vector database using cosine similarity matching.
   - A match is identified above the confidence threshold, returning a rich payload: *Name: Sarah, Relationship: Daughter, Recent Visit: Yesterday, Favorite Song: "You Are My Sunshine", Hobbies: Gardening*.

4. **Patient Voice Query:**
   - The patient sees the visitor, hesitates, and asks out loud: *"Who is she?"*
   - The mobile microphone captures the voice snippet and streams it to the backend.

5. **Speech-to-Text & Context Assembly:**
   - Whisper transcribes the patient's voice query into text.
   - The backend bundles the transcript ("Who is she?") with the retrieved visual context payload (Sarah's relationship, memories, recent visits).

6. **Natural Language Generation:**
   - The bundled context is fed into the LLM (Groq Llama 3 or local Ollama Qwen3-8B) with a companion persona prompt.
   - The LLM composes a warm, natural answer: *"This is your daughter Sarah. She visited you yesterday and brought your favorite blueberry muffins."*

7. **Voice Synthesis & Playback:**
   - The response text is synthesized into high-quality natural speech via Piper/Kokoro TTS.
   - The audio stream is delivered directly into the patient's Bluetooth earbud, providing subtle, private reassurance.

---

## Core Differentiator: Rich Memory vs. Bare Face Identification

> [!important] Protecting the Product Vision
> NeuroTwin must **never** degrade into a simple face-identification app that merely announces names (e.g., *"Detected: Sarah Varma"*).

The fundamental value proposition of NeuroTwin lies in the **richness and depth of the context stored per person**:
- **Life Events & Shared Stories:** Reminders of past trips, family milestones, and meaningful anecdotes.
- **Auditory & Emotional Anchors:** Favorite songs, voice notes from relatives, and personal hobbies.
- **Relational Context:** Explanations of how a person fits into the patient's family tree.

By coupling visual recognition with rich episodic memory, retrieval feels to the patient like **a lost memory naturally returning**, rather than a technology system reading database attributes aloud.

---

## Related Documentation
- [[02 - Architecture Overview]] — Technical data flow and system component interaction.
- [[10 - Privacy and Ethics]] — Biometric sensitivity, consent models, and data protection guidelines.
