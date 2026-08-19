from fastapi import APIRouter, HTTPException
from typing import List
from app.schemas import MemoryCreate
from app.services.json_store import JSONStore

router = APIRouter(prefix="/memories", tags=["Caregiver - Memories & Stories"])

_memories_store = JSONStore("memories.json")

# Seed default data on first run
_DEFAULT_MEMORIES = [
    {
        "title": "Graduated law school in 2016",
        "description": "Attended commencement ceremony in San Francisco.",
        "person_binding": "Sarah Varma",
        "category": "life_event"
    },
    {
        "title": "Caught first fish at Lake Tahoe",
        "description": "Summer vacation when she was 8 years old.",
        "person_binding": "Sarah Varma",
        "category": "anecdote"
    },
    {
        "title": "You Are My Sunshine",
        "description": "Used as soothing audio anchor during moments of hesitation.",
        "person_binding": "Sarah Varma",
        "category": "song"
    },
]


def _seed_if_empty():
    if not _memories_store.list():
        for m in _DEFAULT_MEMORIES:
            _memories_store.create(m)


@router.get("")
async def list_memories():
    _seed_if_empty()
    return _memories_store.list()


@router.post("", status_code=201)
async def create_memory(memory: MemoryCreate):
    return _memories_store.create({
        "person_binding": memory.person_id,
        "title": memory.title,
        "description": memory.description,
        "event_date": memory.event_date,
        "category": memory.category,
    })


@router.get("/{memory_id}")
async def get_memory(memory_id: str):
    item = _memories_store.get(memory_id)
    if not item:
        raise HTTPException(status_code=404, detail="Memory not found")
    return item


@router.delete("/{memory_id}", status_code=204)
async def delete_memory(memory_id: str):
    if not _memories_store.delete(memory_id):
        raise HTTPException(status_code=404, detail="Memory not found")
    return None
