"""Tests for the health/telemetry endpoint."""


def test_health_returns_200(client):
    r = client.get("/api/v1/health")
    assert r.status_code == 200


def test_health_status_online(client):
    r = client.get("/api/v1/health")
    data = r.json()
    assert data["status"] == "online"
    assert data["service"] == "NeuroTwin FastAPI Engine"


def test_health_has_components(client):
    r = client.get("/api/v1/health")
    components = r.json()["components"]
    assert "fastapi" in components
    assert "qdrant_vector_db" in components
    assert "ollama_llm" in components
    assert "whisper_stt" in components
    assert "tts_piper" in components
    assert "face_recognition" in components


def test_health_has_system_metrics(client):
    r = client.get("/api/v1/health")
    metrics = r.json()["system_metrics"]
    assert "cpu_percent" in metrics
    assert "memory_percent" in metrics
    assert "memory_used_gb" in metrics
    assert "memory_total_gb" in metrics
    assert "qdrant_vectors" in metrics


def test_health_has_version(client):
    r = client.get("/api/v1/health")
    assert "version" in r.json()
    assert r.json()["version"] == "0.2.0"


def test_root_endpoint(client):
    r = client.get("/")
    assert r.status_code == 200
    data = r.json()
    assert "NeuroTwin" in data["message"]
    assert data["documentation"] == "/docs"
