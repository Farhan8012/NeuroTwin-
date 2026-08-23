"""In-memory TTL cache for live visual context streamed from the camera.

Lets voice conversations have full, real-time access to the latest camera
frame, recognized persons, VLM scene descriptions, traits (e.g. glasses), and detected objects.
"""

import threading
import time
from typing import Any, Dict, List, Optional
from datetime import datetime, timezone

from app.config import settings

_lock = threading.Lock()
_latest_frame_bytes: Optional[bytes] = None

_state: Dict[str, Any] = {
    "person": None,
    "face_detected": False,
    "person_present": False,
    "wearing_glasses": False,
    "glasses_visible": False,
    "glasses_location": "not visible",
    "confidence": 0.0,
    "objects": [],
    "scene_summary": "",
    "last_seen_timestamp": None,
    "expires_at": 0.0,
}


def store_latest_frame(image_bytes: bytes) -> None:
    global _latest_frame_bytes
    with _lock:
        _latest_frame_bytes = image_bytes


def get_latest_frame() -> Optional[bytes]:
    with _lock:
        return _latest_frame_bytes


def store_visual_context(
    person: Optional[dict] = None,
    objects: Optional[List[Any]] = None,
    face_detected: bool = False,
    person_present: bool = False,
    wearing_glasses: bool = False,
    glasses_visible: bool = False,
    glasses_location: str = "not visible",
    confidence: float = 0.0,
    scene_summary: str = "",
) -> None:
    now_iso = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    with _lock:
        _state["person"] = person
        _state["objects"] = list(objects or [])
        _state["face_detected"] = face_detected or person_present or bool(person)
        _state["person_present"] = person_present or face_detected or bool(person)
        _state["wearing_glasses"] = wearing_glasses
        _state["glasses_visible"] = glasses_visible
        _state["glasses_location"] = glasses_location
        _state["confidence"] = confidence
        _state["scene_summary"] = scene_summary
        _state["last_seen_timestamp"] = now_iso
        _state["expires_at"] = time.time() + settings.CONTEXT_CACHE_TTL


def get_visual_context() -> Dict[str, Any]:
    with _lock:
        is_active = time.time() <= _state["expires_at"]
        return {
            "camera_active": is_active,
            "person": _state["person"] if is_active else None,
            "face_detected": _state["face_detected"] if is_active else False,
            "person_present": _state["person_present"] if is_active else False,
            "wearing_glasses": _state["wearing_glasses"] if is_active else False,
            "glasses_visible": _state["glasses_visible"] if is_active else False,
            "glasses_location": _state["glasses_location"] if is_active else "not visible",
            "confidence": _state["confidence"] if is_active else 0.0,
            "objects": list(_state["objects"]) if is_active else [],
            "scene_summary": _state["scene_summary"] if is_active else "",
            "last_seen_timestamp": _state["last_seen_timestamp"],
        }