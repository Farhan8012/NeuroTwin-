"""Tests for the frame processing endpoint (face recognition + object detection)."""


def test_frame_upload_returns_200(client, sample_image_bytes):
    r = client.post(
        "/api/v1/frame",
        files={"file": ("test.jpg", sample_image_bytes, "image/jpeg")},
    )
    assert r.status_code == 200


def test_frame_response_structure(client, sample_image_bytes):
    r = client.post(
        "/api/v1/frame",
        files={"file": ("test.jpg", sample_image_bytes, "image/jpeg")},
    )
    data = r.json()
    assert "matched" in data
    assert "confidence" in data
    assert "person" in data
    assert "detected_objects" in data
    assert "processing_time_ms" in data
    assert isinstance(data["matched"], bool)
    assert isinstance(data["confidence"], float)
    assert isinstance(data["detected_objects"], list)


def test_frame_without_file(client):
    """Frame endpoint should handle missing file gracefully."""
    r = client.post("/api/v1/frame")
    # Should still return 200 (handles empty bytes)
    assert r.status_code == 200


def test_frame_processing_time(client, sample_image_bytes):
    r = client.post(
        "/api/v1/frame",
        files={"file": ("test.jpg", sample_image_bytes, "image/jpeg")},
    )
    assert r.json()["processing_time_ms"] > 0
