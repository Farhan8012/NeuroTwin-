from app.services.dns_patch import apply_dns_patch
apply_dns_patch()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config import settings
from app.auth import APIKeyMiddleware
from app.routers import health, frame, voice, people, memories, medicines, emergency, objects, ble, metrics, albums, auth
from app.services import json_store, people_store, supabase_sync

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

# Serve TTS audio + person photos (e.g. /static/audio/response_x.wav)
settings.STATIC_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=settings.STATIC_DIR), name="static")

# Serve Web Dashboard under /app and root
web_dir = settings.BASE_DIR.parent / "web"
dashboard_dist = settings.BASE_DIR.parent / "dashboard" / "dist"

if web_dir.exists():
    app.mount("/app", StaticFiles(directory=web_dir, html=True), name="web_app")
if dashboard_dist.exists():
    app.mount("/dashboard", StaticFiles(directory=dashboard_dist, html=True), name="dashboard_app")

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
app.include_router(albums.router, prefix=settings.API_V1_STR)
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(metrics.router)  # /metrics is at root, not under /api/v1


@app.on_event("startup")
async def hydrate_from_supabase() -> None:
    """If a local JSON store is empty but the cloud DB has rows (fresh clone,
    wiped data dir), pull the cloud copy down before serving traffic."""
    import logging
    log = logging.getLogger("neurotwin.supabase")
    if not supabase_sync.enabled():
        log.info("Supabase sync disabled (no URL/key configured)")
        return

    stores = {
        "memories.json": json_store.JSONStore("memories.json"),
        "medicines.json": json_store.JSONStore("medicines.json"),
        "emergency_contacts.json": json_store.JSONStore("emergency_contacts.json"),
    }
    for filename, store in stores.items():
        cloud = supabase_sync.hydrate_if_empty(filename, store.list())
        if cloud:
            store.write_all(cloud)
            log.info("hydrated %s with %d cloud rows", filename, len(cloud))

    cloud_people = people_store.list_people()
    hydrated = supabase_sync.hydrate_people(cloud_people)
    if hydrated:
        people_store.write_all(hydrated)
        log.info("hydrated people registry with %d cloud rows", len(hydrated))

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