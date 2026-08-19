from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.auth import APIKeyMiddleware
from app.routers import health, frame, voice, people, memories, medicines, emergency, objects, ble

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Central Orchestrator Backend for NeuroTwin — AI Cognitive Companion"
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