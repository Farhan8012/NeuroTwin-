import platform
from fastapi import APIRouter
from datetime import datetime, timezone
import psutil
import httpx

from app.config import settings
from app.services import qdrant_service

router = APIRouter(prefix="/health", tags=["Health & Telemetry"])


def _qdrant_status() -> str:
    if getattr(qdrant_service, "is_connected", False):
        return "connected (Qdrant Cloud)" if settings.QDRANT_URL else "connected (local)"
    if hasattr(qdrant_service, "client") and qdrant_service.client:
        return "connected (in-memory)"
    return "disconnected"


async def _llm_status() -> str:
    if settings.LLM_PROVIDER == "groq" and settings.GROQ_API_KEY:
        return "active (Groq Cloud GPT-OSS-120B)"
    try:
        async with httpx.AsyncClient(timeout=0.5) as client:
            resp = await client.get(f"{settings.OLLAMA_BASE_URL}/api/tags")
            return "active (Ollama local)" if resp.status_code == 200 else "unreachable"
    except Exception:
        return "unreachable"


def _stt_status() -> str:
    if settings.STT_PROVIDER == "groq" and settings.GROQ_API_KEY:
        return "ready (Groq Cloud Whisper-large-v3)"
    return "ready (Whisper local)"


@router.get("")
async def get_health():
    vm = psutil.virtual_memory()
    qdrant_status_str = _qdrant_status()
    qdrant_ok = "connected" in qdrant_status_str
    llm_ok = await _llm_status()
    stats = qdrant_service.collection_stats() if qdrant_ok else {}

    return {
        "status": "online",
        "service": "NeuroTwin Cloud Engine",
        "version": settings.VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "components": {
            "fastapi": "healthy",
            "qdrant_vector_db": qdrant_status_str,
            "llm_engine": llm_ok,
            "stt_engine": _stt_status(),
            "tts_piper": "ready",
            "face_recognition": "ready",
        },
        "system_metrics": {
            "host": f"NeuroTwin Cloud Host ({platform.system()} {platform.machine()})",
            "cpu_percent": psutil.cpu_percent(interval=0.3),
            "memory_percent": vm.percent,
            "memory_used_gb": round(vm.used / (1024 ** 3), 2),
            "memory_total_gb": round(vm.total / (1024 ** 3), 2),
            "qdrant_vectors": stats,
        },
    }