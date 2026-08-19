"""In-memory TTL cache for recently matched visual context.

Lets a voice query within a short window reuse the latest face/object match
without re-querying Qdrant (see 04 - Backend: In-Memory Session Caching)."""

import threading
import time
from typing import Any, Dict, Optional

from app.config import settings

_lock = threading.Lock()
_state: Dict[str, Any] = {"person": None, "objects": [], "expires_at": 0.0}


def store_visual_context(person: Optional[dict], objects: list) -> None:
    with _lock:
        _state["person"] = person
        _state["objects"] = objects
        _state["expires_at"] = time.time() + settings.CONTEXT_CACHE_TTL


def get_visual_context() -> Dict[str, Any]:
    with _lock:
        if time.time() > _state["expires_at"]:
            return {"person": None, "objects": []}
        return {"person": _state["person"], "objects": list(_state["objects"])}