"""Tests for object tracking endpoints."""


def test_list_objects(client):
    r = client.get("/api/v1/objects")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_object_location_not_found(client):
    r = client.get("/api/v1/objects/nonexistent/location")
    assert r.status_code == 404
