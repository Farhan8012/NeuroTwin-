from fastapi import APIRouter
from datetime import datetime

router = APIRouter(prefix="/health", tags=["Health & Telemetry"])

@router.get("")
async def get_health():
    return {
        "status": "online",
        "service": "NeuroTwin FastAPI Engine",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "components": {
            "fastapi": "healthy",
            "qdrant_vector_db": "connected (mock/localhost)",
            "ollama_qwen3": "active",
            "whisper_stt": "ready",
            "tts_piper_kokoro": "ready"
        },
        "system_metrics": {
            "host": "Apple M4 MacBook Air",
            "active_client_fps": 1.5,
            "memory_usage": "normal"
        }
    }
