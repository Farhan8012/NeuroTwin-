"""Objects tracking — list tracked items and query last-seen location."""

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any

from app.services import qdrant_service

router = APIRouter(prefix="/objects", tags=["Object Tracking"])


@router.get("", response_model=List[Dict[str, Any]])
async def list_objects():
    """Return all tracked objects (glasses, keys, etc.) from Qdrant."""
    return qdrant_service.list_objects()


@router.get("/{object_class}/location")
async def get_object_location(object_class: str):
    """Return the most recently seen location for a given object class."""
    loc = qdrant_service.latest_object_location(object_class)
    if not loc:
        raise HTTPException(status_code=404, detail=f"No location found for '{object_class}'")
    return loc
