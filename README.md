# NeuroTwin — AI Cognitive & Memory Companion

[![FastAPI](https://img.shields.io/badge/FastAPI-0.141+-009688.svg?style=flat&logo=FastAPI&logoColor=white)](https://fastapi.tiangolo.com)
[![Groq Cloud](https://img.shields.io/badge/Groq-GPT--OSS--120B%20%7C%20Whisper-F05A28.svg?style=flat)](https://groq.com)
[![Qdrant Cloud](https://img.shields.io/badge/Qdrant-Vector%20Database-DC2626.svg?style=flat&logo=qdrant&logoColor=white)](https://qdrant.tech)
[![Supabase](https://img.shields.io/badge/Supabase-Cloud%20Postgres-3ECF8E.svg?style=flat&logo=supabase&logoColor=white)](https://supabase.com)
[![Android](https://img.shields.io/badge/Android-Jetpack%20Compose-3DDC84.svg?style=flat&logo=android&logoColor=white)](https://developer.android.com)
[![React](https://img.shields.io/badge/React%2018-Vite%20%7C%20Three.js-61DAFB.svg?style=flat&logo=react&logoColor=black)](https://vitejs.dev)

**NeuroTwin** is an end-to-end ambient AI cognitive and memory companion designed to support individuals with memory impairment (such as Alzheimer's and Dementia) and empower their caregivers.

The system combines **real-time facial biometric recognition (InsightFace ArcFace)**, **ultra-fast cloud reasoning (Groq LLM + Groq Whisper)**, **durable vector search (Qdrant Cloud)**, and **cloud database write-through synchronization (Supabase)** with both a **Native Android Mobile Client (CameraX Live Vision & Voice Assistant)** and a **Modern Caregiver Web Dashboard (React + Vite)**.

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    subgraph Mobile Client [📱 Android Client - Kotlin / Jetpack Compose]
        Cam[CameraX Live Viewfinder] -->|Streams JPEG Frames| API_Frame[POST /api/v1/frame]
        Mic[Hold-to-Talk / Quick Chips] -->|Streams Voice / Text| API_Voice[POST /api/v1/voice-query]
        Speaker[Piper TTS Player] <---|Audio .wav Stream| API_Voice
    end

    subgraph Backend Orchestrator [⚡ FastAPI Engine - Python 3.12]
        API_Frame --> FaceEngine[InsightFace Buffalo_L]
        API_Frame --> YOLO[YOLO Object Detector]
        FaceEngine -->|512-d ArcFace Embeddings| Qdrant[(Qdrant Cloud\nCollection: people)]
        YOLO -->|128-d Feature Embeddings| Qdrant_Obj[(Qdrant Cloud\nCollection: objects)]
        
        FaceEngine & YOLO --> ContextCache[context_cache.py\nMulti-Modal TTL Cache]
        
        API_Voice --> STT[Groq Whisper Cloud\nwhisper-large-v3]
        STT --> LLM[Groq Cloud LLM\nopenai/gpt-oss-120b]
        ContextCache -.->|Live Camera Context| LLM
        LLM --> TTS[Piper TTS Engine\nen_US-lessac-medium]
        
        LLM -->|Memory Intent Detected| Store[JSONStore & Sync Engine]
        Store <===>|Write-Through Sync| Supabase[(Supabase Cloud\nPostgres Database)]
    end

    subgraph Web Portal [🌐 Caregiver & Senior Web Dashboard]
        Dashboard[React 18 + Vite Portal\nhttp://localhost:5173]
        VanillaApp[Senior Companion Web App\nhttp://localhost:8000/app/]
    end

    Dashboard <===>|REST API & Telemetry| Backend Orchestrator
    VanillaApp <===>|REST API| Backend Orchestrator
```

---

## ✨ Core Capabilities

### 1. 👁️ Real-Time Camera Vision & Face Identification
- **InsightFace ArcFace 512-d Biometrics**: Extracts facial biometric vectors in ~15ms and performs cosine distance matching against Qdrant Cloud.
- **Ambient Memory Grounding**: Identifies family members, caregivers, doctors, and friends, retrieving their shared relationship and recent visit notes.
- **In-App Camera Viewfinder**: The Android app includes an embedded CameraX preview that continuously keeps the AI model synchronized with what is in front of the lens.

### 2. 🧠 Groq Cloud Reasoning & Dynamic Grounding
- **Zero Hallucinations**: Prompt generation is grounded strictly in real database records (from Supabase/JSON store) and live camera perception.
- **Warm Cognitive Companion Persona**: Delivers empathetic, comforting 1–2 sentence spoken responses tailored for elderly individuals with memory challenges.
- **Voice Playback**: Piper neural TTS synthesizes warm speech audio in real-time.

### 3. 💾 Automated Supabase Memory Persistence
- **Spoken Memory Ingestion**: The agent detects when the user says *"Remember that my glasses are in the nightstand"* or *"Please remember that my grandson Leo loves strawberry gelato"*.
- **Structured Extraction**: Extracts title, description, category, and person bindings, saving them immediately to Supabase Cloud Postgres.
- **Instant Recall**: When asked *"Where are my glasses?"*, the AI queries the database and gives the precise stored location.

### 4. 🌐 Multi-Platform Experience
- **Native Android App**: Jetpack Compose senior UI with emergency SOS calling, medication schedules, family cards, memory anchors, and hold-to-talk voice assistant.
- **Caregiver Web Dashboard**: React + Vite interface with real-time neural recall index, patient status monitoring, medication scheduling, and memory management.
- **Accessible Senior Web App**: Single-page patient companion served directly by FastAPI at `/app/`.

---

## 🚀 Quickstart Guide

### 1. Backend Setup
```bash
cd backend
# Create virtual environment and install dependencies
uv venv --python 3.12 .venv
source .venv/bin/activate
pip install -r requirements.txt

# Start the FastAPI server (runs on port 8000)
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- **API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Senior Web App**: [http://localhost:8000/app/](http://localhost:8000/app/)

---

### 2. Caregiver Web Dashboard (React + Vite)
```bash
cd dashboard
npm install
npm run dev
```
- **Dashboard URL**: [http://localhost:5173/](http://localhost:5173/)

---

### 3. Android Mobile Client
```bash
cd mobile
# Build debug APK
./gradlew assembleDebug

# Install on physical device over Wireless ADB or USB
adb install -r app/build/outputs/apk/debug/app-debug.apk
```
*Note: The app automatically connects over your local Wi-Fi network without requiring physical USB cables.*

---

## ⚙️ Configuration (`backend/.env`)

```ini
# LLM Provider Configuration
LLM_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key_here

# Speech-to-Text
STT_PROVIDER=groq

# Qdrant Vector Database (Cloud or Local)
QDRANT_URL=https://your-cluster.qdrant.io
QDRANT_API_KEY=your_qdrant_key_here
QDRANT_COLLECTION_PEOPLE=people
QDRANT_COLLECTION_OBJECTS=objects
FACE_MATCH_THRESHOLD=0.50

# Supabase Cloud Database (Write-Through Sync)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here
```

---

## 📂 Repository Structure

```
Neuro_Twin/
├── backend/                  # FastAPI orchestrator, AI pipelines, services
│   ├── app/
│   │   ├── routers/          # API endpoints (frame, voice, people, memories, medicines)
│   │   ├── services/         # LLM, Face, Qdrant, STT, TTS, Supabase sync, Context cache
│   │   ├── models/           # Piper ONNX neural voices
│   │   └── config.py         # Application settings & environment loader
│   ├── static/               # Uploaded photos, generated TTS audio, debug APK
│   └── requirements.txt      # Python dependencies
├── dashboard/                # Modern React 18 + Vite Caregiver & Patient Web App
│   ├── src/                  # React components, Three.js neural monitor, context
│   └── package.json          # Node dependencies
├── mobile/                   # Native Android Jetpack Compose application
│   └── app/src/main/java/com/neurotwin/app/
│       ├── MainActivity.kt   # App entry point & permission manager
│       ├── PatientScreen.kt  # Senior UI, Live Camera Viewfinder, AI Companion
│       └── service/          # Voice recorder, conversation manager, camera service
├── web/                      # Vanilla JS/CSS Senior Patient & Caregiver Web Portal
├── NeuroTwin/                # Obsidian knowledge vault & design docs
├── USAGE.md                  # Comprehensive operating & troubleshooting manual
└── README.md                 # Master project documentation
```

---

## 🔒 Privacy, Ethics & Safety
- **Biometric Security**: Face embeddings in Qdrant are mathematical 512-dimensional representations that cannot be reverse-engineered into original photos.
- **Local Fallbacks**: Operates gracefully with offline rule-based and local LLM fallbacks if internet or cloud services are unreachable.
- **Medical Disclaimer**: NeuroTwin is an assistive cognitive support system and is not intended to replace professional medical diagnosis or clinical care.
