"""Piper TTS service — synthesizes warm, natural-sounding response audio."""

import logging
import uuid
import wave
from pathlib import Path

from app.config import settings

logger = logging.getLogger("neurotwin.tts")

_voice = None


def _get_voice():
    global _voice
    if _voice is None:
        from piper import PiperVoice

        _voice = PiperVoice.load(
            str(settings.PIPER_MODEL_PATH),
            str(settings.PIPER_CONFIG_PATH),
        )
        logger.info("Piper voice loaded: %s", settings.PIPER_MODEL_PATH.name)
    return _voice


def synthesize(text: str) -> str:
    """Synthesize text to a WAV file under static/audio. Returns the URL path."""
    settings.AUDIO_OUT_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"response_{uuid.uuid4().hex[:8]}.wav"
    out_path: Path = settings.AUDIO_OUT_DIR / filename

    with wave.open(str(out_path), "wb") as wav_file:
        _get_voice().synthesize_wav(text, wav_file)

    return f"/static/audio/{filename}"