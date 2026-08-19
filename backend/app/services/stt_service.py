"""Speech-to-Text service using faster-whisper (CPU, int8) on the M4."""

import logging
from typing import Optional

from app.config import settings

logger = logging.getLogger("neurotwin.stt")

_model = None


def _get_model():
    global _model
    if _model is None:
        from faster_whisper import WhisperModel

        _model = WhisperModel(
            settings.WHISPER_MODEL,
            device="cpu",
            compute_type="int8",
            download_root=str(settings.WHISPER_DOWNLOAD_ROOT),
        )
        logger.info("Whisper '%s' model loaded (CPU int8)", settings.WHISPER_MODEL)
    return _model


def transcribe(audio_path: str) -> str:
    segments, _ = _get_model().transcribe(audio_path)
    return "".join(seg.text for seg in segments).strip()