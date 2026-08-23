"""In-memory TTL cache for live visual context streamed from the camera.

Lets voice conversations have full, real-time access to the latest camera
frame, recognized persons, detected objects, and scene descriptions.
"""

import threading
import time
from typing import Any, Dict, List, Optional
from datetime import datetime, timezone

from app.config import settings

_lock = threading.Lock()
_state: Dict[str, Any] = {
    "person": None,
    "face_detected": False,
    "confidence": 0.0,
    "objects": [],
    "last_seen_timestamp": None,
    "expires_at": 0.0,
}


def store_visual_context(
    person: Optional[dict] = None,
    objects: Optional[List[dict]] = None,
    face_detected: bool = False,
    confidence: float = 0.0,
) -> None:
    now_iso = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    with _lock:
        _state["person"] = person
        _state["objects"] = list(objects or [])
        _state["face_detected"] = face_detected or bool(person)
        _state["confidence"] = confidence
        _state["last_seen_timestamp"] = now_iso
        _state["expires_at"] = time.time() + settings.CONTEXT_CACHE_TTL


def get_visual_context() -> Dict[str, Any]:
    with _lock:
        is_active = time.time() <= _state["expires_at"]
        return {
            "camera_active": is_active,
            "person": _state["person"] if is_active else None,
            "face_detected": _state["face_detected"] if is_active else False,
            "confidence": _state["confidence"] if is_active else 0.0,
            "objects": list(_state["objects"]) if is_active else [],
            "last_seen_timestamp": _state["last_seen_timestamp"],
        }