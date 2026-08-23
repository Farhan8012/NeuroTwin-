"""Text-to-Speech service: Microsoft Edge Neural TTS (ultra-fast ~0.4s) -> Google TTS -> Piper.

Filters all emojis, icons, and non-ASCII decorative characters so speech is
completely natural without weird artifacts like speaking "blossom" or "flower".
"""

import logging
import uuid
import re
import asyncio
from pathlib import Path
from typing import Optional

from app.config import settings

logger = logging.getLogger("neurotwin.tts")

_piper_voice = None


def clean_for_speech(text: str) -> str:
    """Strip all emojis, decorative unicode symbols, and markdown so speech is purely natural."""
    if not text:
        return ""
    # 1. Remove non-ASCII characters (emojis like 🌼, 🌸, 😊, 👓, special punctuation)
    cleaned = re.sub(r"[^\x00-\x7F]+", " ", text)
    # 2. Remove markdown formatting characters (*, _, #, `, ~, etc.)
    cleaned = re.sub(r"[*_#`~>\[\]\(\)\{\}\\\/]", " ", cleaned)
    # 3. Collapse multiple spaces and trim
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def _synthesize_edge_tts(text: str) -> Optional[str]:
    """Synthesize using Microsoft Edge Neural TTS (fastest & highest quality)."""
    speech_text = clean_for_speech(text)
    if not speech_text:
        return None

    try:
        import edge_tts

        settings.AUDIO_OUT_DIR.mkdir(parents=True, exist_ok=True)
        filename = f"response_{uuid.uuid4().hex[:8]}.mp3"
        out_path: Path = settings.AUDIO_OUT_DIR / filename

        async def _run():
            communicate = edge_tts.Communicate(speech_text, "en-US-JennyNeural", rate="+5%")
            await communicate.save(str(out_path))

        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as pool:
                    pool.submit(lambda: asyncio.run(_run())).result()
            else:
                loop.run_until_complete(_run())
        except Exception:
            asyncio.run(_run())

        if out_path.exists() and out_path.stat().st_size > 0:
            logger.info("Edge-TTS speech generated: %s (%d bytes)", filename, out_path.stat().st_size)
            return f"/static/audio/{filename}"
    except Exception as e:
        logger.debug("Edge-TTS synthesis failed: %s", e)

    return None


def _synthesize_gtts(text: str) -> Optional[str]:
    """Synthesize using Google TTS (free fallback)."""
    speech_text = clean_for_speech(text)
    if not speech_text:
        return None

    try:
        from gtts import gTTS

        settings.AUDIO_OUT_DIR.mkdir(parents=True, exist_ok=True)
        filename = f"response_{uuid.uuid4().hex[:8]}.mp3"
        out_path: Path = settings.AUDIO_OUT_DIR / filename

        tts = gTTS(text=speech_text, lang="en", slow=False)
        tts.save(str(out_path))

        logger.info("gTTS speech generated for: '%s' (%s, %d bytes)", speech_text[:50], filename, out_path.stat().st_size)
        return f"/static/audio/{filename}"
    except Exception as e:
        logger.warning("gTTS synthesis failed: %s", e)
        return None


def _get_piper_voice():
    """Lazy-load local Piper TTS model (fallback)."""
    global _piper_voice
    if _piper_voice is None:
        try:
            from piper.voice import PiperVoice
            if settings.PIPER_MODEL_PATH.exists() and settings.PIPER_CONFIG_PATH.exists():
                _piper_voice = PiperVoice.load(
                    str(settings.PIPER_MODEL_PATH),
                    config_path=str(settings.PIPER_CONFIG_PATH)
                )
                logger.info("Piper TTS voice loaded: %s", settings.PIPER_MODEL_PATH.name)
            else:
                _piper_voice = False
        except Exception as e:
            logger.debug("Failed to load Piper TTS voice: %s", e)
            _piper_voice = False
    return _piper_voice if _piper_voice is not False else None


def _synthesize_piper(text: str) -> Optional[str]:
    """Synthesize using local Piper TTS."""
    speech_text = clean_for_speech(text)
    if not speech_text:
        return None

    try:
        import wave
        settings.AUDIO_OUT_DIR.mkdir(parents=True, exist_ok=True)
        filename = f"response_{uuid.uuid4().hex[:8]}.wav"
        out_path: Path = settings.AUDIO_OUT_DIR / filename

        voice = _get_piper_voice()
        if not voice:
            return None

        with wave.open(str(out_path), "wb") as wav_file:
            voice.synthesize_wav(speech_text, wav_file)

        return f"/static/audio/{filename}"
    except Exception as e:
        logger.warning("Piper TTS synthesize error: %s", e)
        return None


def synthesize(text: str) -> Optional[str]:
    """Synthesize text to audio. Priority: Edge-TTS (ultra-fast) -> gTTS -> Piper."""
    # 1. Try Microsoft Edge Neural TTS (ultra-fast ~0.4s & HD voice)
    result = _synthesize_edge_tts(text)
    if result:
        return result

    # 2. Try Google TTS
    result = _synthesize_gtts(text)
    if result:
        return result

    # 3. Fallback to Piper local TTS
    result = _synthesize_piper(text)
    if result:
        return result

    logger.warning("All TTS engines failed for text: %s...", text[:50])
    return None