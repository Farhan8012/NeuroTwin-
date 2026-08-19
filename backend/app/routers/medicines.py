from fastapi import APIRouter, HTTPException
from typing import List
from app.schemas import MedicineItem
from app.services.json_store import JSONStore

router = APIRouter(prefix="/medicines", tags=["Caregiver - Medications"])

_medicines_store = JSONStore("medicines.json")


@router.get("", response_model=List[MedicineItem])
async def list_medicines():
    return _medicines_store.list()


@router.post("", response_model=MedicineItem, status_code=201)
async def add_medicine(item: MedicineItem):
    return _medicines_store.create(item.model_dump())


@router.get("/{medicine_id}", response_model=MedicineItem)
async def get_medicine(medicine_id: str):
    item = _medicines_store.get(medicine_id)
    if not item:
        raise HTTPException(status_code=404, detail="Medicine not found")
    return item


@router.put("/{medicine_id}", response_model=MedicineItem)
async def update_medicine(medicine_id: str, item: MedicineItem):
    updated = _medicines_store.update(medicine_id, item.model_dump())
    if not updated:
        raise HTTPException(status_code=404, detail="Medicine not found")
    return updated


@router.delete("/{medicine_id}", status_code=204)
async def delete_medicine(medicine_id: str):
    if not _medicines_store.delete(medicine_id):
        raise HTTPException(status_code=404, detail="Medicine not found")
    return None
