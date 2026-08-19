"""Tests for emergency contacts CRUD endpoints."""


def test_list_emergency_contacts(client):
    r = client.get("/api/v1/emergency-contacts")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_create_emergency_contact(client):
    r = client.post("/api/v1/emergency-contacts", json={
        "id": "",
        "name": "Test Contact",
        "relationship": "Friend",
        "phone": "555-1234",
        "is_primary": False,
    })
    assert r.status_code == 201
    data = r.json()
    assert data["name"] == "Test Contact"
    assert data["phone"] == "555-1234"
    # Cleanup
    client.delete(f"/api/v1/emergency-contacts/{data['id']}")


def test_get_emergency_contact(client, created_contact_id):
    r = client.get(f"/api/v1/emergency-contacts/{created_contact_id}")
    assert r.status_code == 200
    assert r.json()["name"] == "Fixture Contact"


def test_get_emergency_contact_not_found(client):
    r = client.get("/api/v1/emergency-contacts/nonexistent")
    assert r.status_code == 404


def test_delete_emergency_contact(client, created_contact_id):
    r = client.delete(f"/api/v1/emergency-contacts/{created_contact_id}")
    assert r.status_code == 204
    r2 = client.get(f"/api/v1/emergency-contacts/{created_contact_id}")
    assert r2.status_code == 404


def test_delete_emergency_contact_not_found(client):
    r = client.delete("/api/v1/emergency-contacts/nonexistent")
    assert r.status_code == 404


def test_list_emergency_has_seeded(client):
    """Verify seeded contacts exist."""
    r = client.get("/api/v1/emergency-contacts")
    names = [c["name"] for c in r.json()]
    assert "Sarah Varma" in names
    assert "Dr. Aris Thorne" in names


def test_primary_contact(client):
    """Verify Sarah Varma is marked as primary."""
    r = client.get("/api/v1/emergency-contacts")
    sarah = next(c for c in r.json() if c["name"] == "Sarah Varma")
    assert sarah["is_primary"] is True
