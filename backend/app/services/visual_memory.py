"""Visual Episodic Memory Store.

Maintains a rolling temporal memory buffer (last 5-15 minutes) of objects,
scene descriptions, and item locations (glasses, keys, medicines, laptops, books)
captured by the camera.

Enables the AI to answer:
- "Where did I leave my glasses?"
- "Where did you last see my reading glasses?"
- "Where is my book / medicine?"
even after the patient turns away from the camera or moves to another room.
"""

import time
import threading
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

logger = logging.getLogger("neurotwin.visual_memory")

_lock = threading.Lock()
# Rolling list of visual episodes: max 50 entries
_episodes: List[Dict[str, Any]] = []
# Specific item last-seen tracking: item_name -> {location, timestamp, scene_summary}
_last_seen_items: Dict[str, Dict[str, Any]] = {}


def record_visual_observation(
    objects_detected: List[str],
    scene_summary: str,
    glasses_location: str = "not visible",
    glasses_visible: bool = False,
    person_present: bool = False,
) -> None:
    """Record a timestamped visual event from the camera stream."""
    now = time.time()
    now_iso = datetime.now(timezone.utc).strftime("%I:%M %p")

    # Clean object list
    clean_objs = [str(o).strip().title() for o in objects_detected if str(o).strip().lower() not in ["person", ""]]

    with _lock:
        # 1. Update specific item trackers
        if glasses_visible or "table" in glasses_location.lower() or "desk" in glasses_location.lower():
            loc_desc = "resting on the table / desk"
            if clean_objs:
                loc_desc += f" next to the {', '.join(clean_objs[:2])}"
            _last_seen_items["glasses"] = {
                "item": "Reading Glasses",
                "location": loc_desc,
                "timestamp": now,
                "time_str": now_iso,
                "scene": scene_summary,
            }
        elif glasses_location == "on face":
            _last_seen_items["glasses"] = {
                "item": "Reading Glasses",
                "location": "being worn on your face",
                "timestamp": now,
                "time_str": now_iso,
                "scene": scene_summary,
            }

        # Track other notable household items
        for obj in clean_objs:
            obj_lower = obj.lower()
            if any(k in obj_lower for k in ["laptop", "book", "bottle", "cup", "phone", "keys", "remote", "med"]):
                _last_seen_items[obj_lower] = {
                    "item": obj,
                    "location": f"on the desk / table in the {scene_summary or 'room'}",
                    "timestamp": now,
                    "time_str": now_iso,
                    "scene": scene_summary,
                }

        # 2. Append to rolling episode history if changed or after 10s
        should_append = True
        if _episodes:
            last = _episodes[-1]
            if (now - last["timestamp"] < 8.0) and (last["summary"] == scene_summary):
                should_append = False

        if should_append and (scene_summary or clean_objs or glasses_visible):
            _episodes.append({
                "timestamp": now,
                "time_str": now_iso,
                "summary": scene_summary,
                "objects": clean_objs,
                "glasses_location": glasses_location,
                "person_present": person_present,
            })
            # Keep only last 50 episodes (~15 minutes)
            if len(_episodes) > 50:
                _episodes.pop(0)


def get_last_seen_item(query: str) -> Optional[Dict[str, Any]]:
    """Look up when and where a specific item was last seen in camera memory."""
    q_lower = query.lower()
    with _lock:
        now = time.time()
        for key, record in _last_seen_items.items():
            if key in q_lower or (key == "glasses" and any(w in q_lower for w in ["glass", "spectacle", "reading"])):
                elapsed_sec = int(now - record["timestamp"])
                if elapsed_sec < 60:
                    ago_str = f"just a few seconds ago ({record['time_str']})"
                elif elapsed_sec < 120:
                    ago_str = f"about 1 minute ago ({record['time_str']})"
                else:
                    ago_str = f"about {elapsed_sec // 60} minutes ago ({record['time_str']})"

                return {
                    "item": record["item"],
                    "location": record["location"],
                    "ago": ago_str,
                    "scene": record.get("scene", ""),
                }
    return None


def get_visual_memory_summary() -> str:
    """Format recent visual history (last 5-10 minutes) for LLM context injection."""
    with _lock:
        now = time.time()
        if not _last_seen_items and not _episodes:
            return "No visual memory recorded yet."

        lines = []

        # 1. Specific last-seen items
        lines.append("Last-Seen Item Locations from Camera Memory:")
        for key, record in _last_seen_items.items():
            elapsed_sec = int(now - record["timestamp"])
            if elapsed_sec < 600:  # within last 10 minutes
                if elapsed_sec < 60:
                    ago = "just a moment ago"
                elif elapsed_sec < 120:
                    ago = "about 1 minute ago"
                else:
                    ago = f"about {elapsed_sec // 60} minutes ago"
                lines.append(f"• {record['item']}: seen {ago} ({record['time_str']}) - {record['location']}")

        # 2. Chronological recent visual timeline (last 4 distinct events)
        if _episodes:
            lines.append("\nRecent Camera Sighting Timeline:")
            for ep in _episodes[-4:]:
                elapsed = int(now - ep["timestamp"])
                ago = f"{elapsed}s ago" if elapsed < 60 else f"{elapsed // 60}m ago"
                summary_text = ep["summary"] or ", ".join(ep["objects"])
                if summary_text:
                    lines.append(f"• [{ago}] {summary_text}")

        return "\n".join(lines)
