"""Speech-to-Text service supporting Groq Cloud Whisper with local faster-whisper fallback."""

import logging
import requests
from typing import Optional
from pathlib import Path

from app.config import settings

logger = logging.getLogger("neurotwin.stt")

_local_model = None

GROQ_AUDIO_TRANSCRIPTIONS_URL = "https://api.groq.com/openai/v1/audio/transcriptions"
GROQ_WHISPER_MODEL = "whisper-large-v3"


def _transcribe_groq(audio_path: str) -> Optional[str]:
    """Transcribe audio using Groq Whisper Cloud API."""
    if not settings.GROQ_API_KEY:
        return None

    try:
        path = Path(audio_path)
        if not path.exists():
            logger.warning("Audio file does not exist: %s", audio_path)
            return None

        with open(path, "rb") as f:
            files = {
                "file": (path.name, f, "audio/wav")
            }
            data = {
                "model": GROQ_WHISPER_MODEL,
                "response_format": "json",
                "temperature": 0.0
            }
            headers = {
                "Authorization": f"Bearer {settings.GROQ_API_KEY}"
            }

            response = requests.post(
                GROQ_AUDIO_TRANSCRIPTIONS_URL,
                headers=headers,
                files=files,
                data=data,
                timeout=15.0
            )

        if response.status_code == 200:
            result = response.json()
            text = result.get("text", "").strip()
            logger.info("Groq Whisper transcription succeeded: '%s'", text[:50])
            return text
        else:
            logger.warning("Groq Whisper API returned %d: %s", response.status_code, response.text[:200])
    except Exception as e:
        logger.warning("Groq Whisper API call failed: %s", e)

    return None


def _get_local_model():
    """Lazy-load local faster-whisper model."""
    global _local_model
    if _local_model is None:
        try:
            from faster_whisper import WhisperModel

            _local_model = WhisperModel(
                settings.WHISPER_MODEL,
                device="cpu",
                compute_type="int8",
                download_root=str(settings.WHISPER_DOWNLOAD_ROOT),
            )
            logger.info("Whisper '%s' model loaded locally (CPU int8)", settings.WHISPER_MODEL)
        except Exception as e:
            logger.warning("Could not load local faster-whisper: %s", e)
            _local_model = False
    return _local_model if _local_model is not False else None


def _transcribe_local(audio_path: str) -> str:
    """Transcribe audio using local faster-whisper."""
    model = _get_local_model()
    if model is not None:
        try:
            segments, _ = model.transcribe(audio_path)
            return "".join(seg.text for seg in segments).strip()
        except Exception as e:
            logger.error("Local Whisper transcription failed: %s", e)
    return ""


def transcribe(audio_path: str) -> str:
    """Transcribe speech: Priority 1 (Groq Cloud Whisper) -> Fallback (Local faster-whisper)."""
    if settings.STT_PROVIDER == "groq" or settings.GROQ_API_KEY:
        groq_text = _transcribe_groq(audio_path)
        if groq_text is not None:
            return groq_text
        logger.info("Groq Whisper unavailable, falling back to local faster-whisper")

    return _transcribe_local(audio_path)