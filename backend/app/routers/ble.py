"""BLE beacon endpoints for object location tracking.

The mobile app scans for BLE beacons and reports RSSI values to these
endpoints. The backend uses multi-receiver triangulation to estimate
which room an object is in.
"""

from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel

from app.services.ble_service import ble_service

router = APIRouter(prefix="/ble", tags=["BLE Beacon Tracking"])


class BeaconRegister(BaseModel):
    beacon_id: str
    object_class: str  # e.g., "reading_glasses", "keys", "wallet"
    label: str         # e.g., "Blue Reading Glasses"


class RSSIReport(BaseModel):
    beacon_id: str
    receiver_id: str   # e.g., "rx_living_room"
    rssi: float        # Signal strength in dBm (negative)


class BeaconResponse(BaseModel):
    id: str
    object_class: str
    label: str
    registered_at: float


class LocationResponse(BaseModel):
    beacon_id: str
    room: str
    distance_meters: Optional[float] = None
    confidence: float
    receiver_id: Optional[str] = None
    readings_used: Optional[int] = None


@router.get("/beacons", response_model=List[BeaconResponse])
async def list_beacons():
    """List all registered BLE beacons."""
    beacons = ble_service.list_beacons()
    # Normalize: JSONStore may use 'beacon_id' or 'id' as primary key
    for b in beacons:
        if "beacon_id" in b and "id" not in b:
            b["id"] = b["beacon_id"]
    return beacons


@router.post("/beacons", response_model=BeaconResponse, status_code=201)
async def register_beacon(beacon: BeaconRegister):
    """Register a new BLE beacon tag attached to an object."""
    result = ble_service.register_beacon(beacon.beacon_id, beacon.object_class, beacon.label)
    if "beacon_id" in result and "id" not in result:
        result["id"] = result["beacon_id"]
    return result


@router.delete("/beacons/{beacon_id}", status_code=204)
async def delete_beacon(beacon_id: str):
    """Remove a registered beacon."""
    if not ble_service.delete_beacon(beacon_id):
        raise HTTPException(status_code=404, detail="Beacon not found")
    return None


@router.post("/rssi", response_model=LocationResponse)
async def report_rssi(report: RSSIReport):
    """Submit an RSSI reading from the mobile app.

    The backend groups recent readings by receiver, calculates median RSSI,
    converts to distance, and determines which room the object is in.
    """
    location = ble_service.report_rssi(report.beacon_id, report.receiver_id, report.rssi)
    if location is None:
        raise HTTPException(status_code=404, detail="Cannot determine location — need more receiver reports")
    return location


@router.get("/beacons/{beacon_id}/location", response_model=LocationResponse)
async def get_beacon_location(beacon_id: str):
    """Get the current estimated location for a registered beacon."""
    location = ble_service.get_beacon_location(beacon_id)
    if location is None:
        raise HTTPException(status_code=404, detail=f"No RSSI data for beacon '{beacon_id}'")
    # Normalize for response model
    if "beacon_id" in location and "id" not in location:
        location["id"] = location["beacon_id"]
    return location
