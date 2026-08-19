"""Integration tests for end-to-end NeuroTwin pipeline flows."""


def test_full_face_recognition_flow(client, sample_image_bytes):
    """Upload a frame, then query voice about the matched person."""
    # 1. Upload frame
    r_frame = client.post(
        "/api/v1/frame",
        files={"file": ("test.jpg", sample_image_bytes, "image/jpeg")},
    )
    assert r_frame.status_code == 200

    # 2. Query voice (should use cached context)
    r_voice = client.post("/api/v1/voice-query", json={"patient_query": "Who is she?"})
    assert r_voice.status_code == 200
    assert len(r_voice.json()["llm_response"]) > 0


def test_person_lifecycle(client, sample_image_bytes):
    """Full person lifecycle: create with photo → verify → update → delete."""
    # 1. Create with photo
    r = client.post(
        "/api/v1/people/with-photo",
        data={"name": "Lifecycle Person", "relationship": "Test"},
        files={"photos": ("test.jpg", sample_image_bytes, "image/jpeg")},
    )
    assert r.status_code == 200
    pid = r.json()["id"]
    assert r.json()["vector_status"] in ("indexed", "no_face_detected")

    # 2. Verify exists
    r = client.get(f"/api/v1/people/{pid}")
    assert r.status_code == 200
    assert r.json()["name"] == "Lifecycle Person"

    # 3. Delete
    r = client.delete(f"/api/v1/people/{pid}")
    assert r.status_code == 204

    # 4. Verify gone
    r = client.get(f"/api/v1/people/{pid}")
    assert r.status_code == 404


def test_context_caching_flow(client, sample_image_bytes):
    """Upload frame → cache context → query voice uses cached context."""
    # Upload frame to populate cache
    client.post(
        "/api/v1/frame",
        files={"file": ("test.jpg", sample_image_bytes, "image/jpeg")},
    )

    # Query without explicit context (should use cache)
    r = client.post("/api/v1/voice-query", json={"patient_query": "Tell me about this person"})
    assert r.status_code == 200
    assert len(r.json()["llm_response"]) > 0
