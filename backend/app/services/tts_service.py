import logging
import uuid
import wave
from pathlib import Path
from typing import Optional

from app.config import settings

logger = logging.getLogger("neurotwin.tts")

_voice = None


def _get_voice():
    global _voice
    if _voice is None:
        try:
            from piper.voice import PiperVoice
            if settings.PIPER_MODEL_PATH.exists() and settings.PIPER_CONFIG_PATH.exists():
                _voice = PiperVoice.load(
                    str(settings.PIPER_MODEL_PATH),
                    config_path=str(settings.PIPER_CONFIG_PATH)
                )
                logger.info("Piper TTS voice loaded: %s", settings.PIPER_MODEL_PATH.name)
            else:
                logger.warning("Piper model files missing at %s", settings.PIPER_MODEL_PATH)
        except Exception as e:
            logger.warning("Failed to load Piper TTS voice: %s", e)
    return _voice


def synthesize(text: str) -> Optional[str]:
    """Synthesize text to a WAV file under static/audio. Returns the URL path or None."""
    if not settings.PIPER_MODEL_PATH.exists() or not settings.PIPER_CONFIG_PATH.exists():
        return None

    try:
        settings.AUDIO_OUT_DIR.mkdir(parents=True, exist_ok=True)
        filename = f"response_{uuid.uuid4().hex[:8]}.wav"
        out_path: Path = settings.AUDIO_OUT_DIR / filename

        voice = _get_voice()
        if not voice:
            return None

        with wave.open(str(out_path), "wb") as wav_file:
            voice.synthesize_wav(text, wav_file)

        return f"/static/audio/{filename}"
    except Exception as e:
        logger.warning("Piper TTS synthesize error: %s", e)
        return None