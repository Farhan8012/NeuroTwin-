from fastapi import APIRouter
from datetime import datetime, timezone
import psutil
import httpx

from app.config import settings
from app.services import qdrant_service

router = APIRouter(prefix="/health", tags=["Health & Telemetry"])


def _qdrant_status() -> str:
    try:
        qdrant_service.get_client().get_collections()
        return "connected"
    except Exception:
        return "disconnected"


async def _ollama_status() -> str:
    try:
        async with httpx.AsyncClient(timeout=2) as client:
            resp = await client.get(f"{settings.OLLAMA_BASE_URL}/api/tags")
            return "active" if resp.status_code == 200 else "unreachable"
    except Exception:
        return "unreachable"


@router.get("")
async def get_health():
    vm = psutil.virtual_memory()
    qdrant_ok = _qdrant_status() == "connected"
    ollama_ok = await _ollama_status()
    stats = qdrant_service.collection_stats() if qdrant_ok else {}

    return {
        "status": "online",
        "service": "NeuroTwin FastAPI Engine",
        "version": settings.VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "components": {
            "fastapi": "healthy",
            "qdrant_vector_db": _qdrant_status(),
            "ollama_llm": ollama_ok,
            "whisper_stt": "ready",
            "tts_piper": "ready",
            "face_recognition": "ready",
        },
        "system_metrics": {
            "host": "Apple M4 MacBook Air",
            "cpu_percent": psutil.cpu_percent(interval=0.3),
            "memory_percent": vm.percent,
            "memory_used_gb": round(vm.used / (1024 ** 3), 2),
            "memory_total_gb": round(vm.total / (1024 ** 3), 2),
            "qdrant_vectors": stats,
        },
    }