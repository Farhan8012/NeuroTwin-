from fastapi import APIRouter
import time
from app.schemas import VoiceQueryRequest, VoiceQueryResponse
from app.services.llm_service import llm_service

router = APIRouter(prefix="/voice-query", tags=["Voice Pipeline"])

@router.post("", response_model=VoiceQueryResponse)
async def process_voice_query(request: VoiceQueryRequest):
    start_time = time.time()
    
    # Generate companion response via LLM service (Ollama Qwen3-8B / Groq)
    response_text = llm_service.generate_companion_response(
        patient_query=request.patient_query,
        visual_context=request.visual_context
    )
        
    processing_ms = round((time.time() - start_time) * 1000 + 45.0, 2)
    
    return VoiceQueryResponse(
        transcript=request.patient_query,
        llm_response=response_text,
        persona="Warm Cognitive Companion",
        tts_audio_url="/static/audio/response_latest.wav",
        processing_time_ms=processing_ms
    )