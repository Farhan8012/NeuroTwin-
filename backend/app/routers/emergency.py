from fastapi import APIRouter
from typing import List
from app.schemas import EmergencyContact

router = APIRouter(prefix="/emergency-contacts", tags=["Caregiver - Emergency Contacts"])

EMERGENCY_DB = [
    {
        "id": "em_01",
        "name": "Sarah Varma",
        "relationship": "Daughter",
        "phone": "+1 (555) 234-5678",
        "is_primary": True
    },
    {
        "id": "em_02",
        "name": "Dr. Aris Thorne",
        "relationship": "Neurologist",
        "phone": "+1 (555) 987-6543",
        "is_primary": False
    }
]

@router.get("", response_model=List[EmergencyContact])
async def list_emergency_contacts():
    return EMERGENCY_DB

@router.post("", response_model=EmergencyContact)
async def add_emergency_contact(contact: EmergencyContact):
    EMERGENCY_DB.append(contact.dict())
    return contact
