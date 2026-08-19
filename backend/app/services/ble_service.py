"""BLE beacon service for object location tracking.

Tracks Bluetooth Low Energy (BLE) beacons attached to objects (glasses, keys,
wallet, pill bottle) and estimates their location based on RSSI signal strength
from multiple fixed receiver beacons placed around the home.

Architecture:
  - Each object has a small BLE tag (e.g., AirTag, Tile, nRF52 beacon).
  - Fixed receiver beacons are placed in known rooms (Living Room, Kitchen,
    Bedroom, etc.).
  - The backend receives RSSI reports from the mobile app and estimates which
    room the object is in based on signal strength proximity.

The mobile app scans for BLE beacons and reports RSSI values to:
  POST /api/v1/ble/rssi
"""

import logging
import math
import time
import uuid
from typing import Dict, List, Optional, Any

from app.config import settings
from app.services.json_store import JSONStore
from app.services import qdrant_service

logger = logging.getLogger("neurotwin.ble")

# BLE beacon store — persistent JSON for registered beacons and receiver locations
_ble_store = JSONStore("ble_beacons.json")
_rssi_log = JSONStore("ble_rssi_log.json")

# Default room configurations (receiver beacon locations)
DEFAULT_RECEIVERS = [
    {"id": "rx_living_room", "room": "Living Room", "description": "Near coffee table"},
    {"id": "rx_kitchen", "room": "Kitchen", "description": "On counter"},
    {"id": "rx_bedroom", "room": "Bedroom", "description": "On nightstand"},
    {"id": "rx_hallway", "room": "Hallway", "description": "Near front door"},
]

# RSSI-to-distance calibration (must be tuned per environment)
# At 1 meter, typical BLE RSSI is about -59 dBm
REFERENCE_RSSI_AT_1M = -59
PATH_LOSS_EXPONENT = 2.5  # Indoor environment (2.0-4.0 typical)

# Room assignment thresholds
ROOM_CONFIDENCE_THRESHOLD = 0.6  # Minimum confidence to assign a room


def estimate_distance_meters(rssi: float) -> float:
    """Estimate distance in meters from RSSI using log-distance path loss model.

    Formula: d = 10 ^ ((REF_RSSI - rssi) / (10 * n))
    where n is the path loss exponent.
    """
    if rssi >= 0:
        return 0.0
    exponent = (REFERENCE_RSSI_AT_1M - rssi) / (10 * PATH_LOSS_EXPONENT)
    return max(0.1, math.pow(10, exponent))


def classify_room(distances: Dict[str, float]) -> Optional[Dict[str, Any]]:
    """Given object→receiver distances, determine the most likely room.

    Returns the room with the closest receiver, with confidence based on
    distance ratio.
    """
    if not distances:
        return None

    # Find receiver map
    receiver_map = {r["id"]: r for r in DEFAULT_RECEIVERS}

    sorted_receivers = sorted(distances.items(), key=lambda x: x[1])
    closest_id, closest_dist = sorted_receivers[0]

    if closest_id not in receiver_map:
        return None

    # Confidence: ratio of closest vs second-closest
    if len(sorted_receivers) > 1:
        second_dist = sorted_receivers[1][1]
        confidence = 1.0 - (closest_dist / max(closest_dist + second_dist, 0.1))
    else:
        confidence = 0.9  # Single receiver, moderate confidence

    return {
        "room": receiver_map[closest_id]["room"],
        "receiver_id": closest_id,
        "distance_meters": round(closest_dist, 2),
        "confidence": round(min(confidence, 1.0), 3),
    }


class BLEService:
    """Tracks BLE-tagged objects and estimates their room location."""

    def register_beacon(self, beacon_id: str, object_class: str, label: str) -> Dict[str, Any]:
        """Register a new BLE beacon tag attached to an object."""
        beacon = {
            "id": beacon_id,  # JSONStore expects 'id' as the primary key
            "object_class": object_class,
            "label": label,
            "registered_at": time.time(),
        }
        _ble_store.create(beacon)
        logger.info("Registered BLE beacon: %s → %s", beacon_id, object_class)
        return beacon

    def report_rssi(self, beacon_id: str, receiver_id: str, rssi: float) -> Optional[Dict[str, Any]]:
        """Process an RSSI report from the mobile app.

        Args:
            beacon_id: The BLE tag ID (e.g., "BLE-GLASSES-001")
            receiver_id: The fixed receiver that detected the signal
            rssi: Signal strength in dBm

        Returns:
            Location estimate with room, distance, confidence
        """
        # Log the RSSI reading
        reading = {
            "beacon_id": beacon_id,
            "receiver_id": receiver_id,
            "rssi": rssi,
            "timestamp": time.time(),
        }
        _rssi_log.create(reading)

        # Get all recent RSSI readings for this beacon (last 30 seconds)
        all_readings = _rssi_log.list()
        cutoff = time.time() - 30
        recent = [
            r for r in all_readings
            if r["beacon_id"] == beacon_id and r["timestamp"] > cutoff
        ]

        # Group by receiver, take median RSSI per receiver
        receiver_rssi: Dict[str, List[float]] = {}
        for r in recent:
            rx = r["receiver_id"]
            receiver_rssi.setdefault(rx, []).append(r["rssi"])

        # Calculate median RSSI per receiver
        median_rssi = {}
        for rx, values in receiver_rssi.items():
            values.sort()
            mid = len(values) // 2
            median_rssi[rx] = values[mid] if len(values) % 2 else (values[mid - 1] + values[mid]) / 2

        # Convert to distances
        distances = {rx: estimate_distance_meters(rssi) for rx, rssi in median_rssi.items()}

        # Classify room
        location = classify_room(distances)
        if location is None:
            return None

        location["beacon_id"] = beacon_id
        location["readings_used"] = len(recent)

        # Update the object in Qdrant if the beacon is registered
        ble_beacons = _ble_store.list()
        beacon_info = next((b for b in ble_beacons if b.get("id") == beacon_id or b.get("beacon_id") == beacon_id), None)
        if beacon_info:
            obj_id = f"ble_{beacon_info['object_class']}"
            qdrant_service.upsert_object(
                obj_id,
                vector=[0.0] * 128,  # BLE objects don't have visual embeddings
                payload={
                    "object_class": beacon_info["object_class"],
                    "label": beacon_info["label"],
                    "last_seen_location": location["room"],
                    "last_seen_timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                    "confidence": location["confidence"],
                    "ble_tag_id": beacon_id,
                    "distance_meters": location["distance_meters"],
                },
            )

        return location

    def get_beacon_location(self, beacon_id: str) -> Optional[Dict[str, Any]]:
        """Get the most recent location estimate for a beacon."""
        all_readings = _rssi_log.list()
        beacon_readings = [r for r in all_readings if r["beacon_id"] == beacon_id]
        if not beacon_readings:
            return None

        # Use the most recent reading
        latest = max(beacon_readings, key=lambda r: r["timestamp"])

        # Get recent readings (last 30s) for this beacon
        cutoff = time.time() - 30
        recent = [r for r in beacon_readings if r["timestamp"] > cutoff]

        receiver_rssi: Dict[str, List[float]] = {}
        for r in recent:
            rx = r["receiver_id"]
            receiver_rssi.setdefault(rx, []).append(r["rssi"])

        median_rssi = {}
        for rx, values in receiver_rssi.items():
            values.sort()
            mid = len(values) // 2
            median_rssi[rx] = values[mid] if len(values) % 2 else (values[mid - 1] + values[mid]) / 2

        distances = {rx: estimate_distance_meters(rssi) for rx, rssi in median_rssi.items()}
        location = classify_room(distances)

        if location:
            location["beacon_id"] = beacon_id
            location["last_update"] = latest["timestamp"]
            return location

        return {"beacon_id": beacon_id, "room": "Unknown", "confidence": 0.0}

    def list_beacons(self) -> List[Dict[str, Any]]:
        """List all registered BLE beacons."""
        return _ble_store.list()

    def delete_beacon(self, beacon_id: str) -> bool:
        """Remove a registered beacon."""
        return _ble_store.delete(beacon_id)


ble_service = BLEService()
