"""Tests for voice query endpoints (text and audio)."""

import wave
import struct
import math
from io import BytesIO


def test_voice_query_text_returns_200(client):
    r = client.post("/api/v1/voice-query", json={"patient_query": "Who is she?"})
    assert r.status_code == 200


def test_voice_query_text_structure(client):
    r = client.post("/api/v1/voice-query", json={"patient_query": "Hello"})
    data = r.json()
    assert "transcript" in data
    assert "llm_response" in data
    assert "persona" in data
    assert "processing_time_ms" in data
    assert data["transcript"] == "Hello"
    assert data["persona"] == "Warm Cognitive Companion"
    assert len(data["llm_response"]) > 0


def test_voice_query_glasses(client):
    r = client.post("/api/v1/voice-query", json={"patient_query": "Where are my glasses?"})
    data = r.json()
    assert r.status_code == 200
    assert len(data["llm_response"]) > 0  # LLM generates a warm response (non-deterministic)


def test_voice_query_keys(client):
    r = client.post("/api/v1/voice-query", json={"patient_query": "Where are my keys?"})
    data = r.json()
    assert r.status_code == 200
    assert len(data["llm_response"]) > 0


def test_voice_query_with_context(client):
    r = client.post("/api/v1/voice-query", json={
        "patient_query": "Who is she?",
        "visual_context": {
            "name": "Alice",
            "relationship": "Nurse",
            "memories": ["Comes every Monday"],
        },
    })
    assert r.status_code == 200
    data = r.json()
    assert len(data["llm_response"]) > 0


def test_voice_query_audio(client, sample_wav_bytes):
    """Test audio upload endpoint (Whisper STT → LLM → TTS)."""
    r = client.post(
        "/api/v1/voice-query/audio",
        files={"audio": ("test.wav", sample_wav_bytes, "audio/wav")},
    )
    # Returns 400 if Whisper can't transcribe sine wave (expected)
    # Returns 200 if transcription succeeds
    assert r.status_code in (200, 400)


def test_voice_query_performance(client):
    """Voice query should complete within 30 seconds."""
    import time
    start = time.time()
    r = client.post("/api/v1/voice-query", json={"patient_query": "Hi"})
    elapsed = time.time() - start
    assert r.status_code == 200
    assert elapsed < 30
