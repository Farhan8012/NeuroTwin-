from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import json as _json
import time
import os
import tempfile
import logging
from typing import Optional
from app.schemas import VoiceQueryRequest, VoiceQueryResponse
from app.services.llm_service import llm_service
from app.services import tts_service, stt_service, context_cache
from app.config import settings

router = APIRouter(prefix="/voice-query", tags=["Voice Pipeline"])
logger = logging.getLogger(__name__)


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

    # Merge explicit visual_context with the TTL-cached context from the last frame
    ctx = request.visual_context
    if not ctx:
        cached = context_cache.get_visual_context()
        if cached.get("person"):
            ctx = cached["person"]

    response_text = llm_service.generate_companion_response(
        patient_query=request.patient_query,
        visual_context=ctx,
    )

    tts_audio_url = await _synthesize_tts(response_text)
    processing_ms = round((time.time() - start_time) * 1000, 2)

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
    if not patient_query:
        raise HTTPException(status_code=400, detail="Could not transcribe audio")

    ctx = None
    if visual_context:
        try:
            ctx = _json.loads(visual_context)
        except Exception:
            pass

    response_text = llm_service.generate_companion_response(
        patient_query=patient_query,
        visual_context=ctx,
    )

    tts_audio_url = await _synthesize_tts(response_text)
    processing_ms = round((time.time() - start_time) * 1000, 2)

    return VoiceQueryResponse(
        transcript=patient_query,
        llm_response=response_text,
        persona="Warm Cognitive Companion",
        tts_audio_url=tts_audio_url,
        processing_time_ms=processing_ms,
    )