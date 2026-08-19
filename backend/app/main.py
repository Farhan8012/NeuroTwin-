from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.auth import APIKeyMiddleware
from app.routers import health, frame, voice, people, memories, medicines, emergency, objects, ble

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="""
# NeuroTwin — AI Cognitive Companion Backend

Central orchestrator for the NeuroTwin memory support system. Provides:

## Patient Pipeline
- **Face Recognition:** Upload camera frames → InsightFace 512-d embedding → Qdrant cosine search → person context
- **Object Detection:** YOLOv8-nano household object detection with Qdrant location tracking
- **Voice Queries:** Text or audio → Whisper STT → Ollama LLM → Piper TTS → WAV response
- **Context Caching:** In-memory TTL cache for visual context continuity between frame and voice

## Caregiver Management
- **People:** Register profiles, upload photos, index face vectors into Qdrant
- **Memories:** Life stories, songs, anecdotes for conversational warmth
- **Medications:** Schedule and dosage tracking
- **Emergency Contacts:** Primary and secondary contacts
- **BLE Beacons:** Room-level object location via RSSI triangulation

## Quick Start
```bash
# Start all services
./start.sh

# Or with Docker
docker compose up --build

# Seed sample data
cd backend && .venv/bin/python seed.py
```

## Authentication
Caregiver endpoints require `X-API-Key` header when `NEUROTWIN_API_KEY` is set.
Patient-facing endpoints (`/health`, `/frame`, `/voice-query`) are always open.
""",
    contact={"name": "NeuroTwin Team"},
    license_info={"name": "MIT"},
    openapi_tags=[
        {"name": "Health & Telemetry", "description": "System health, component status, and M4 metrics"},
        {"name": "Vision Pipeline", "description": "Camera frame processing and face recognition"},
        {"name": "Voice Pipeline", "description": "Voice queries with STT, LLM reasoning, and TTS"},
        {"name": "Caregiver - People Management", "description": "Register, update, and delete person profiles with face vectors"},
        {"name": "Caregiver - Memories & Stories", "description": "Memory anchors, life events, songs, and anecdotes"},
        {"name": "Caregiver - Medications", "description": "Medication schedule and dosage tracking"},
        {"name": "Caregiver - Emergency Contacts", "description": "Emergency contact management"},
        {"name": "Object Tracking", "description": "Household object detection and location tracking"},
        {"name": "BLE Beacon Tracking", "description": "Bluetooth Low Energy beacon registration and RSSI triangulation"},
    ],
)

# Enable CORS for Caregiver Web Dashboard & Mobile Client
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*", "X-API-Key"],
)

# API key authentication for caregiver endpoints
app.add_middleware(APIKeyMiddleware)

# Include Router Endpoints
app.include_router(health.router, prefix=settings.API_V1_STR)
app.include_router(frame.router, prefix=settings.API_V1_STR)
app.include_router(voice.router, prefix=settings.API_V1_STR)
app.include_router(people.router, prefix=settings.API_V1_STR)
app.include_router(memories.router, prefix=settings.API_V1_STR)
app.include_router(medicines.router, prefix=settings.API_V1_STR)
app.include_router(emergency.router, prefix=settings.API_V1_STR)
app.include_router(objects.router, prefix=settings.API_V1_STR)
app.include_router(ble.router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {
        "message": "NeuroTwin Central Orchestrator Engine",
        "documentation": "/docs",
        "health": f"{settings.API_V1_STR}/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)