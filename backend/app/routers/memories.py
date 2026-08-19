from fastapi import APIRouter
from typing import List
from app.schemas import MemoryCreate

router = APIRouter(prefix="/memories", tags=["Caregiver - Memories & Stories"])

MEMORIES_DB = [
    {
        "id": "mem_01",
        "person_binding": "Sarah Varma",
        "title": "Graduated law school in 2016",
        "description": "Attended commencement ceremony in San Francisco.",
        "category": "life_event"
    },
    {
        "id": "mem_02",
        "person_binding": "Sarah Varma",
        "title": "Caught first fish at Lake Tahoe",
        "description": "Summer vacation when she was 8 years old.",
        "category": "anecdote"
    },
    {
        "id": "mem_03",
        "person_binding": "Sarah Varma",
        "title": "You Are My Sunshine",
        "description": "Used as soothing audio anchor during moments of hesitation.",
        "category": "song"
    }
]

@router.get("")
async def list_memories():
    return MEMORIES_DB

@router.post("")
async def create_memory(memory: MemoryCreate):
    new_item = {
        "id": f"mem_{len(MEMORIES_DB) + 1:02d}",
        "person_binding": "Sarah Varma",
        "title": memory.title,
        "description": memory.description,
        "category": memory.category
    }
    MEMORIES_DB.append(new_item)
    return new_item
