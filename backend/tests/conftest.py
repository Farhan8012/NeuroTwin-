"""Shared fixtures for NeuroTwin backend tests."""

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(scope="session")
def client():
    """Create a TestClient that persists across all tests in the session."""
    from app.main import app
    return TestClient(app)


@pytest.fixture(scope="session")
def sample_image_bytes():
    """Generate a minimal JPEG image for frame upload tests."""
    from PIL import Image
    from io import BytesIO

    img = Image.new("RGB", (640, 480), color=(100, 150, 200))
    buf = BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)
    return buf.read()


@pytest.fixture(scope="session")
def sample_wav_bytes():
    """Generate a 1-second WAV file (440Hz sine wave) for audio upload tests."""
    import wave
    import struct
    import math
    from io import BytesIO

    sample_rate = 16000
    duration = 1
    buf = BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        for i in range(sample_rate * duration):
            val = int(16000 * math.sin(2 * math.pi * 440 * i / sample_rate))
            wf.writeframes(struct.pack("<h", val))
    return buf.getvalue()


@pytest.fixture
def created_person_id(client):
    """Create a person and return the ID, cleaning up after the test."""
    r = client.post("/api/v1/people", json={
        "name": "Fixture Person",
        "relationship": "Test",
    })
    person_id = r.json()["id"]
    yield person_id
    client.delete(f"/api/v1/people/{person_id}")


@pytest.fixture
def created_memory_id(client):
    """Create a memory and return the ID, cleaning up after the test."""
    r = client.post("/api/v1/memories", json={
        "title": "Fixture memory",
        "description": "Created by pytest fixture",
        "category": "story",
    })
    mem_id = r.json()["id"]
    yield mem_id
    client.delete(f"/api/v1/memories/{mem_id}")


@pytest.fixture
def created_medicine_id(client):
    """Create a medicine and return the ID, cleaning up after the test."""
    r = client.post("/api/v1/medicines", json={
        "id": "",
        "name": "Fixture Med",
        "dosage": "10mg",
        "schedule_time": "08:00 AM",
        "instructions": "Take with food",
    })
    med_id = r.json()["id"]
    yield med_id
    client.delete(f"/api/v1/medicines/{med_id}")


@pytest.fixture
def created_contact_id(client):
    """Create an emergency contact and return the ID, cleaning up after the test."""
    r = client.post("/api/v1/emergency-contacts", json={
        "id": "",
        "name": "Fixture Contact",
        "relationship": "Friend",
        "phone": "555-0000",
        "is_primary": False,
    })
    contact_id = r.json()["id"]
    yield contact_id
    client.delete(f"/api/v1/emergency-contacts/{contact_id}")
