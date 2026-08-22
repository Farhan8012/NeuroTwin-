"""Lightweight JSON-backed registry for person profiles.

Qdrant stores face embeddings + searchable payload; this file-backed registry
holds the full caregiver-entered profile metadata and photo references so that
people can exist before (or without) a face being indexed.
"""

import json
import logging
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from app.config import settings
from app.services import supabase_sync

logger = logging.getLogger("neurotwin.registry")

DATA_FILE: Path = settings.BASE_DIR / "data" / "people.json"
_lock = threading.Lock()
_next_id = 100


def _now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _load() -> List[Dict[str, Any]]:
    if not DATA_FILE.exists():
        return []
    try:
        return json.loads(DATA_FILE.read_text())
    except Exception as exc:
        logger.warning("Could not read registry (%s) — starting empty", exc)
        return []


def _save(people: List[Dict[str, Any]]) -> None:
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    DATA_FILE.write_text(json.dumps(people, indent=2))


def list_people() -> List[Dict[str, Any]]:
    with _lock:
        return _load()


def write_all(people: List[Dict[str, Any]]) -> None:
    """Replace registry contents wholesale (used by startup hydration)."""
    with _lock:
        _save(list(people))


def get_person(person_id: str) -> Optional[Dict[str, Any]]:
    with _lock:
        for p in _load():
            if p["id"] == person_id:
                return p
    return None


def create_person(payload: Dict[str, Any]) -> Dict[str, Any]:
    global _next_id
    with _lock:
        people = _load()
        if people:
            _next_id = max(int(p["id"].split("_")[-1]) for p in people) + 1
        person_id = f"p_{_next_id:03d}"
        now = _now()
        person = {
            "id": person_id,
            "created_at": now,
            "updated_at": now,
            "photo_urls": [],
            "vector_status": "pending",
            **payload,
        }
        people.append(person)
        _save(people)
    supabase_sync.sync_person_create(person)
    return person


def update_person(person_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    with _lock:
        people = _load()
        for p in people:
            if p["id"] == person_id:
                p.update(updates)
                p["updated_at"] = _now()
                _save(people)
                updated = dict(p)
                break
        else:
            return None
    supabase_sync.sync_person_update(updated)
    return updated


def delete_person(person_id: str) -> bool:
    with _lock:
        people = _load()
        remaining = [p for p in people if p["id"] != person_id]
        if len(remaining) == len(people):
            return False
        _save(remaining)
    supabase_sync.sync_person_delete(person_id)
    return True