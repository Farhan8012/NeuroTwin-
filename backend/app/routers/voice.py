from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import json as _json
import time
import os
import tempfile
import logging
import uuid
import threading
from datetime import datetime, timezone
from typing import Optional
from app.schemas import VoiceQueryRequest, VoiceQueryResponse
from app.services.llm_service import llm_service
from app.services import tts_service, stt_service, context_cache
from app.services import supabase_sync
from app.config import settings
from app.routers.metrics import record_voice_query

router = APIRouter(prefix="/voice-query", tags=["Voice Pipeline"])
logger = logging.getLogger(__name__)


def _log_conversation_to_supabase(transcript: str, response: str, source: str = "voice", processing_ms: float = 0):
    """Log conversation to Supabase 'conversations' table in background thread."""
    if not supabase_sync.enabled():
        return

    def _run():
        try:
            import httpx
            row = {
                "id": str(uuid.uuid4()),
                "transcript": transcript,
                "response": response,
                "source": source,
                "processing_time_ms": processing_ms,
                "created_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            }
            url = f"{settings.SUPABASE_URL.rstrip('/')}/rest/v1/conversations"
            headers = {
                "apikey": settings.SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {settings.SUPABASE_SERVICE_KEY}",
                "Content-Type": "application/json",
                "Prefer": "return=minimal",
            }
            resp = httpx.post(url, json=row, headers=headers, timeout=5.0)
            if resp.status_code in (200, 201):
                logger.info("supabase ← conversation logged: %s...", transcript[:40])
            else:
                logger.warning("supabase conversation log failed (%d): %s", resp.status_code, resp.text[:200])
        except Exception as exc:
            logger.warning("supabase conversation log error: %s", exc)

    threading.Thread(target=_run, daemon=True).start()



async def _transcribe_audio(audio: UploadFile) -> str:
    """Save uploaded audio to temp file, run Whisper STT, clean up."""
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        content = await audio.read()
        tmp.write(content)
        tmp_path = tmp.name
    try:
        text = stt_service.transcribe(tmp_path)
    finally:
        os.unlink(tmp_path)
    return text


async def _synthesize_tts(text: str) -> Optional[str]:
    """Run Piper TTS synthesis; return URL or None on failure."""
    try:
        return tts_service.synthesize(text)
    except Exception as e:
        logger.warning("TTS synthesis failed: %s", e)
        return None


# --- Endpoint 1: JSON body (web dashboard sends this) ---
@router.post("", response_model=VoiceQueryResponse)
async def process_voice_query(request: VoiceQueryRequest):
    """Process a voice query sent as JSON: { patient_query, visual_context? }"""
    start_time = time.time()

    # Merge explicit visual_context with the TTL-cached context from the live camera stream
    ctx = request.visual_context
    if not ctx:
        ctx = context_cache.get_visual_context()

    response_text = llm_service.generate_companion_response(
        patient_query=request.patient_query,
        visual_context=ctx,
    )

    tts_audio_url = await _synthesize_tts(response_text)
    processing_ms = round((time.time() - start_time) * 1000, 2)
    record_voice_query(time.time() - start_time)

    # Log to Supabase
    _log_conversation_to_supabase(request.patient_query, response_text, source="text", processing_ms=processing_ms)

    return VoiceQueryResponse(
        transcript=request.patient_query,
        llm_response=response_text,
        persona="Warm Cognitive Companion",
        tts_audio_url=tts_audio_url,
        processing_time_ms=processing_ms,
    )


# --- Endpoint 2: Multipart form (mobile app sends audio) ---
@router.post("/audio", response_model=VoiceQueryResponse)
async def process_voice_audio(
    audio: UploadFile = File(...),
    visual_context: Optional[str] = Form(None),
):
    """Multipart upload: audio file + optional JSON visual_context string."""
    start_time = time.time()

    patient_query = await _transcribe_audio(audio)
    if not patient_query or not patient_query.strip():
        patient_query = "Hello, NeuroTwin"

    ctx = None
    if visual_context:
        try:
            ctx = _json.loads(visual_context)
        except Exception:
            pass
    if not ctx:
        ctx = context_cache.get_visual_context()

    response_text = llm_service.generate_companion_response(
        patient_query=patient_query,
        visual_context=ctx,
    )

    tts_audio_url = await _synthesize_tts(response_text)
    processing_ms = round((time.time() - start_time) * 1000, 2)
    record_voice_query(time.time() - start_time)

    # Log to Supabase
    _log_conversation_to_supabase(patient_query, response_text, source="audio", processing_ms=processing_ms)

    return VoiceQueryResponse(
        transcript=patient_query,
        llm_response=response_text,
        persona="Warm Cognitive Companion",
        tts_audio_url=tts_audio_url,
        processing_time_ms=processing_ms,
    )