"""Generic JSON-backed store for simple CRUD collections.

Provides persistent file-backed storage for lists of items (memories, medicines,
emergency contacts, etc.) without requiring a full database.
"""

import json
import logging
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from app.config import settings
from app.services import supabase_sync

logger = logging.getLogger("neurotwin.store")


class JSONStore:
    def __init__(self, filename: str):
        self._file: Path = settings.DATA_DIR / filename
        self._lock = threading.Lock()
        self._filename = filename

    def _now(self) -> str:
        return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

    def _load(self) -> List[Dict[str, Any]]:
        if not self._file.exists():
            return []
        try:
            return json.loads(self._file.read_text())
        except Exception as exc:
            logger.warning("Could not read %s — starting empty: %s", self._file.name, exc)
            return []

    def _save(self, items: List[Dict[str, Any]]) -> None:
        self._file.parent.mkdir(parents=True, exist_ok=True)
        self._file.write_text(json.dumps(items, indent=2))

    def list(self) -> List[Dict[str, Any]]:
        with self._lock:
            return self._load()

    def write_all(self, items: List[Dict[str, Any]]) -> None:
        """Replace file contents wholesale (used by startup hydration)."""
        with self._lock:
            self._save(list(items))

    def get(self, item_id: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            for item in self._load():
                if item.get("id") == item_id:
                    return item
        return None

    def create(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        with self._lock:
            items = self._load()
            # Strip empty/auto-generated IDs so the UUID takes precedence
            clean = {k: v for k, v in payload.items() if k != "id" or v}
            new_item = {
                "id": str(uuid.uuid4())[:12],
                "created_at": self._now(),
                **clean,
            }
            items.append(new_item)
            self._save(items)
        supabase_sync.sync_create(self._filename, new_item)
        return new_item

    def update(self, item_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        with self._lock:
            items = self._load()
            for item in items:
                if item.get("id") == item_id:
                    item.update(updates)
                    self._save(items)
                    updated = dict(item)
                    break
            else:
                return None
        supabase_sync.sync_update(self._filename, updated)
        return updated

    def delete(self, item_id: str) -> bool:
        with self._lock:
            items = self._load()
            remaining = [i for i in items if i.get("id") != item_id]
            if len(remaining) == len(items):
                return False
            self._save(remaining)
        supabase_sync.sync_delete(self._filename, item_id)
        return True
