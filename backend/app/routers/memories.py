from fastapi import APIRouter, HTTPException
from typing import List
from app.schemas import MemoryCreate
from app.services.json_store import JSONStore

router = APIRouter(prefix="/memories", tags=["Caregiver - Memories & Stories"])

_memories_store = JSONStore("memories.json")


@router.get("")
async def list_memories():
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
