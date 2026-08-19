"""Tests for memories CRUD endpoints."""


def test_list_memories(client):
    r = client.get("/api/v1/memories")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_create_memory(client):
    r = client.post("/api/v1/memories", json={
        "title": "Test memory",
        "description": "A test memory",
        "category": "story",
        "person_id": "p_102",
    })
    assert r.status_code == 201
    data = r.json()
    assert data["title"] == "Test memory"
    assert data["category"] == "story"
    assert "id" in data
    # Cleanup
    client.delete(f"/api/v1/memories/{data['id']}")


def test_get_memory(client, created_memory_id):
    r = client.get(f"/api/v1/memories/{created_memory_id}")
    assert r.status_code == 200
    assert r.json()["title"] == "Fixture memory"


def test_get_memory_not_found(client):
    r = client.get("/api/v1/memories/nonexistent")
    assert r.status_code == 404


def test_delete_memory(client, created_memory_id):
    r = client.delete(f"/api/v1/memories/{created_memory_id}")
    assert r.status_code == 204
    r2 = client.get(f"/api/v1/memories/{created_memory_id}")
    assert r2.status_code == 404


def test_delete_memory_not_found(client):
    r = client.delete("/api/v1/memories/nonexistent")
    assert r.status_code == 404


def test_list_memories_has_seeded(client):
    """Verify seeded memories exist."""
    r = client.get("/api/v1/memories")
    titles = [m["title"] for m in r.json()]
    assert "Graduated law school in 2016" in titles
    assert "You Are My Sunshine" in titles
