"""Tests for medicines CRUD endpoints."""


def test_list_medicines(client):
    r = client.get("/api/v1/medicines")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_create_medicine(client):
    r = client.post("/api/v1/medicines", json={
        "id": "",
        "name": "Test Med",
        "dosage": "5mg",
        "schedule_time": "12:00 PM",
        "instructions": "Take with water",
    })
    assert r.status_code == 201
    data = r.json()
    assert data["name"] == "Test Med"
    # Cleanup
    client.delete(f"/api/v1/medicines/{data['id']}")


def test_get_medicine(client, created_medicine_id):
    r = client.get(f"/api/v1/medicines/{created_medicine_id}")
    assert r.status_code == 200
    assert r.json()["name"] == "Fixture Med"


def test_get_medicine_not_found(client):
    r = client.get("/api/v1/medicines/nonexistent")
    assert r.status_code == 404


def test_delete_medicine(client, created_medicine_id):
    r = client.delete(f"/api/v1/medicines/{created_medicine_id}")
    assert r.status_code == 204
    r2 = client.get(f"/api/v1/medicines/{created_medicine_id}")
    assert r2.status_code == 404


def test_list_medicines_has_seeded(client):
    """Verify seeded medications exist."""
    r = client.get("/api/v1/medicines")
    names = [m["name"] for m in r.json()]
    assert "Donepezil" in names
    assert "Memantine" in names
