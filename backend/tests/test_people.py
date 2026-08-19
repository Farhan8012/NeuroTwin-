"""Tests for people CRUD endpoints."""


def test_list_people_returns_list(client):
    r = client.get("/api/v1/people")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_create_person(client):
    r = client.post("/api/v1/people", json={
        "name": "Alice Test",
        "relationship": "Sister",
        "birthday": "1990-05-15",
        "memories": ["Grew up together"],
    })
    assert r.status_code == 200
    data = r.json()
    assert data["name"] == "Alice Test"
    assert data["relationship"] == "Sister"
    assert data["birthday"] == "1990-05-15"
    assert data["id"].startswith("p_")
    assert data["vector_status"] == "pending"
    # Cleanup
    client.delete(f"/api/v1/people/{data['id']}")


def test_get_person_by_id(client, created_person_id):
    r = client.get(f"/api/v1/people/{created_person_id}")
    assert r.status_code == 200
    assert r.json()["id"] == created_person_id
    assert r.json()["name"] == "Fixture Person"


def test_get_person_not_found(client):
    r = client.get("/api/v1/people/p_999")
    assert r.status_code == 404


def test_update_person(client, created_person_id):
    r = client.put(f"/api/v1/people/{created_person_id}", json={
        "name": "Updated Person",
        "relationship": "Updated",
    })
    assert r.status_code == 200
    assert r.json()["name"] == "Updated Person"


def test_delete_person(client, created_person_id):
    r = client.delete(f"/api/v1/people/{created_person_id}")
    assert r.status_code == 204
    # Verify deleted
    r2 = client.get(f"/api/v1/people/{created_person_id}")
    assert r2.status_code == 404


def test_delete_person_not_found(client):
    r = client.delete("/api/v1/people/p_999")
    assert r.status_code == 404


def test_list_people_includes_seeded(client):
    """Verify seeded people (Sarah Varma, Dr. Thorne, Robert Lowe) exist."""
    r = client.get("/api/v1/people")
    names = [p["name"] for p in r.json()]
    assert "Sarah Varma" in names
    assert "Dr. Aris Thorne" in names
    assert "Robert Lowe" in names


def test_create_person_with_photo(client, sample_image_bytes):
    """Test multipart person creation with photo upload."""
    r = client.post(
        "/api/v1/people/with-photo",
        data={
            "name": "Photo Person",
            "relationship": "Test",
            "birthday": "1985-03-20",
        },
        files={"photos": ("test.jpg", sample_image_bytes, "image/jpeg")},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["name"] == "Photo Person"
    assert len(data["photo_urls"]) > 0
    # Cleanup
    client.delete(f"/api/v1/people/{data['id']}")
