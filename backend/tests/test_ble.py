"""Tests for BLE beacon tracking endpoints."""


def test_list_beacons(client):
    r = client.get("/api/v1/ble/beacons")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_register_beacon(client):
    r = client.post("/api/v1/ble/beacons", json={
        "beacon_id": "BLE-TEST-001",
        "object_class": "reading_glasses",
        "label": "Test Glasses",
    })
    assert r.status_code == 201
    data = r.json()
    assert data["id"] == "BLE-TEST-001"
    assert data["object_class"] == "reading_glasses"
    # Cleanup
    client.delete(f"/api/v1/ble/beacons/{data['id']}")


def test_delete_beacon(client):
    # Create
    client.post("/api/v1/ble/beacons", json={
        "beacon_id": "BLE-DEL-001",
        "object_class": "keys",
        "label": "Test Keys",
    })
    # Delete
    r = client.delete("/api/v1/ble/beacons/BLE-DEL-001")
    assert r.status_code == 204


def test_delete_beacon_not_found(client):
    r = client.delete("/api/v1/ble/beacons/BLE-NONEXISTENT")
    assert r.status_code == 404


def test_rssi_report(client):
    """Submit RSSI readings and verify location estimation."""
    # Register a beacon
    client.post("/api/v1/ble/beacons", json={
        "beacon_id": "BLE-RSSI-TEST",
        "object_class": "reading_glasses",
        "label": "RSSI Test Glasses",
    })

    # Submit multiple RSSI readings from different receivers
    # Living room receiver should get strongest signal
    for _ in range(3):
        r = client.post("/api/v1/ble/rssi", json={
            "beacon_id": "BLE-RSSI-TEST",
            "receiver_id": "rx_living_room",
            "rssi": -45,  # Strong signal = close
        })
        assert r.status_code == 200

    # Kitchen receiver gets weaker signal
    for _ in range(3):
        r = client.post("/api/v1/ble/rssi", json={
            "beacon_id": "BLE-RSSI-TEST",
            "receiver_id": "rx_kitchen",
            "rssi": -75,  # Weak signal = far
        })
        assert r.status_code == 200

    # Verify location is "Living Room"
    r = client.get("/api/v1/ble/beacons/BLE-RSSI-TEST/location")
    assert r.status_code == 200
    location = r.json()
    assert location["room"] == "Living Room"
    assert location["confidence"] > 0

    # Cleanup
    client.delete("/api/v1/ble/beacons/BLE-RSSI-TEST")


def test_beacon_location_not_found(client):
    r = client.get("/api/v1/ble/beacons/BLE-NONEXISTENT/location")
    assert r.status_code == 404
