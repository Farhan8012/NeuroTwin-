"""Write-through Supabase (PostgREST) mirror for JSON-backed stores.

Local JSON files remain the fast, offline-capable read path.  Every mutation
is mirrored to Supabase Postgres so the cloud DB is a durable, queryable copy.
All network failures are logged and swallowed — Supabase outages must never
break local operation.

Mirrors always receive the FULL post-mutation item so a PATCH never nulls
unrelated Postgres columns.

Configure via backend/.env:
    SUPABASE_URL=https://<ref>.supabase.co
    SUPABASE_SERVICE_KEY=<service_role secret>
If either is missing, syncing is silently disabled.
"""

import logging
import threading
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import httpx

from app.config import settings

logger = logging.getLogger("neurotwin.supabase")

_TIMEOUT = httpx.Timeout(5.0)


def _headers() -> Dict[str, str]:
    return {
        "apikey": settings.SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
    }


def enabled() -> bool:
    return bool(settings.SUPABASE_URL and settings.SUPABASE_SERVICE_KEY)


def _base() -> str:
    return f"{settings.SUPABASE_URL.rstrip('/')}/rest/v1"


def _epoch_to_iso(epoch: float) -> str:
    return datetime.fromtimestamp(epoch, tz=timezone.utc).isoformat().replace("+00:00", "Z")


def _clean(value: Any) -> Any:
    """Coerce values Postgres will reject ('' dates, etc.)."""
    if value == "":
        return None
    return value


# ── Row mappers per store ────────────────────────────────────────────

def _map_memories(item: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": item["id"],
        "title": item.get("title"),
        "description": item.get("description"),
        "category": item.get("category") or "story",
        "event_date": _clean(item.get("event_date")),
        "person_binding": item.get("person_binding"),
    }


def _map_medicines(item: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": item["id"],
        "name": item.get("name"),
        "dosage": _clean(item.get("dosage")),
        "schedule_time": item.get("schedule_time"),
        "instructions": item.get("instructions"),
        "active": bool(item.get("active", True)),
    }


def _map_emergency_contacts(item: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": item["id"],
        "name": item.get("name"),
        "relationship": item.get("relationship"),
        "phone": _clean(item.get("phone")),
        "is_primary": bool(item.get("is_primary")),
    }


def _map_ble_beacons(item: Dict[str, Any]) -> Dict[str, Any]:
    registered = item.get("registered_at")
    return {
        # Postgres PK is the physical beacon id, not the registry row id
        "id": item.get("beacon_id") or item["id"],
        "object_class": item.get("object_class"),
        "label": item.get("label"),
        "is_receiver": False,
        "registered_at": _epoch_to_iso(registered) if isinstance(registered, (int, float)) else None,
    }


def _map_ble_rssi_log(item: Dict[str, Any]) -> Dict[str, Any]:
    ts = item.get("timestamp")
    return {
        "tag_id": item.get("beacon_id"),
        "receiver_id": item.get("receiver_id"),
        "rssi": int(round(item.get("rssi", -100))),
        "recorded_at": _epoch_to_iso(ts) if isinstance(ts, (int, float)) else None,
    }


STORES: Dict[str, Dict[str, Any]] = {
    "memories.json": {"table": "memories", "map": _map_memories},
    "medicines.json": {"table": "medicines", "map": _map_medicines},
    "emergency_contacts.json": {"table": "emergency_contacts", "map": _map_emergency_contacts},
    "ble_beacons.json": {"table": "ble_beacons", "map": _map_ble_beacons},
    "ble_rssi_log.json": {"table": "ble_rssi_log", "map": _map_ble_rssi_log},
}

PEOPLE_TABLE = "people"


def map_person(person: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": person["id"],
        "patient_id": person.get("patient_id") or "pt-001",
        "name": person.get("name"),
        "relationship": person.get("relationship"),
        "birthday": _clean(person.get("birthday")),
        "memories": person.get("memories") or [],
        "important_life_events": person.get("important_life_events") or [],
        "favorite_songs": person.get("favorite_songs") or [],
        "favorite_places": person.get("favorite_places") or [],
        "hobbies": person.get("hobbies") or [],
        "family_stories": person.get("family_stories") or [],
        "voice_notes": person.get("voice_notes") or [],
        "vector_status": person.get("vector_status") or "pending",
        "photo_urls": person.get("photo_urls") or [],
    }


# ── Low-level PostgREST helpers ──────────────────────────────────────

def _client() -> httpx.Client:
    return httpx.Client(timeout=_TIMEOUT)


def _post_row(table: str, row: Dict[str, Any], *, on_conflict: str = "id") -> None:
    with _client() as client:
        resp = client.post(
            f"{_base()}/{table}",
            json=row,
            params={"on_conflict": on_conflict},
            headers={**_headers(), "Prefer": "resolution=merge-deduplicate"},
        )
        resp.raise_for_status()


def _patch_row(table: str, row_id: str, row: Dict[str, Any]) -> None:
    with _client() as client:
        resp = client.patch(f"{_base()}/{table}", json=row,
                            params={"id": f"eq.{row_id}"}, headers=_headers())
        resp.raise_for_status()


def _delete_row(table: str, row_id: str) -> None:
    with _client() as client:
        resp = client.delete(f"{_base()}/{table}", params={"id": f"eq.{row_id}"}, headers=_headers())
        resp.raise_for_status()


def _ensure_receiver(receiver_id: Optional[str]) -> None:
    if not receiver_id:
        return
    try:
        _post_row("ble_beacons", {
            "id": receiver_id,
            "label": receiver_id.replace("_", " ").title(),
            "room": receiver_id.removeprefix("rx_").replace("_", " ").title(),
            "is_receiver": True,
        })
    except Exception as exc:
        logger.warning("supabase receiver upsert failed (%s): %s", receiver_id, exc)


# ── Fire-and-forget mutation mirroring ───────────────────────────────

def _mirror(store_filename: str, op: str, item_id: str, item: Optional[Dict[str, Any]]) -> None:
    cfg = STORES.get(store_filename)
    if not cfg or not enabled():
        return

    def _run():
        try:
            table = cfg["table"]
            if op == "delete":
                _delete_row(table, item_id)
            else:
                row = cfg["map"](item or {})
                if store_filename == "ble_rssi_log.json":
                    _ensure_receiver(row.get("receiver_id"))
                if op == "create":
                    _post_row(table, row)
                else:
                    _patch_row(table, item_id, row)
            logger.info("supabase ← %s %s/%s", op, table, item_id)
        except Exception as exc:
            logger.warning("supabase %s %s failed: %s", op, store_filename, exc)

    threading.Thread(target=_run, daemon=True).start()


def sync_create(store_filename: str, item: Dict[str, Any]) -> None:
    _mirror(store_filename, "create", item.get("id", ""), item)


def sync_update(store_filename: str, item: Dict[str, Any]) -> None:
    _mirror(store_filename, "update", item["id"], item)


def sync_delete(store_filename: str, item_id: str) -> None:
    _mirror(store_filename, "delete", item_id, None)


# people_store mirrors (synchronous — people ops are rare)

def sync_person_create(person: Dict[str, Any]) -> None:
    if not enabled():
        return
    try:
        _post_row(PEOPLE_TABLE, map_person(person))
        logger.info("supabase ← create people/%s", person["id"])
    except Exception as exc:
        logger.warning("supabase person create failed: %s", exc)


def sync_person_update(person: Dict[str, Any]) -> None:
    if not enabled():
        return
    try:
        _patch_row(PEOPLE_TABLE, person["id"], map_person(person))
        logger.info("supabase ← update people/%s", person["id"])
    except Exception as exc:
        logger.warning("supabase person update failed: %s", exc)


def sync_person_delete(person_id: str) -> None:
    if not enabled():
        return
    try:
        _delete_row(PEOPLE_TABLE, person_id)
        logger.info("supabase ← delete people/%s", person_id)
    except Exception as exc:
        logger.warning("supabase person delete failed: %s", exc)


# ── Startup hydration: pull cloud rows when local store is empty ─────

def fetch_table(table: str) -> List[Dict[str, Any]]:
    with _client() as client:
        resp = client.get(f"{_base()}/{table}", params={"select": "*"}, headers=_headers())
        resp.raise_for_status()
        return resp.json()


def hydrate_if_empty(store_filename: str, local_items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Return cloud rows when the local file is empty and cloud has data."""
    if not enabled() or local_items:
        return []
    cfg = STORES.get(store_filename)
    if not cfg:
        return []
    try:
        rows = fetch_table(cfg["table"])
        if rows:
            logger.info("supabase → hydrating %d rows into %s", len(rows), store_filename)
        return rows
    except Exception as exc:
        logger.warning("supabase hydration check failed for %s: %s", store_filename, exc)
        return []


def hydrate_people(local_people: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    if not enabled() or local_people:
        return []
    try:
        rows = fetch_table(PEOPLE_TABLE)
        if rows:
            logger.info("supabase → hydrating %d people", len(rows))
        return rows
    except Exception as exc:
        logger.warning("supabase people hydration failed: %s", exc)
        return []