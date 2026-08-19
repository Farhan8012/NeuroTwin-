from fastapi import APIRouter
from typing import List
from app.schemas import MedicineItem

router = APIRouter(prefix="/medicines", tags=["Caregiver - Medications"])

MEDICINES_DB = [
    {
        "id": "med_01",
        "name": "Donepezil",
        "dosage": "10 mg",
        "schedule_time": "08:00 AM Daily",
        "instructions": "Take with breakfast water"
    },
    {
        "id": "med_02",
        "name": "Memantine",
        "dosage": "10 mg",
        "schedule_time": "08:00 PM Daily",
        "instructions": "Take after evening meal"
    }
]

@router.get("", response_model=List[MedicineItem])
async def list_medicines():
    return MEDICINES_DB

@router.post("", response_model=MedicineItem)
async def add_medicine(item: MedicineItem):
    MEDICINES_DB.append(item.dict())
    return item
