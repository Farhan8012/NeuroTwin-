from fastapi import APIRouter, HTTPException
from typing import List
from app.schemas import EmergencyContact
from app.services.json_store import JSONStore

router = APIRouter(prefix="/emergency-contacts", tags=["Caregiver - Emergency Contacts"])

_contacts_store = JSONStore("emergency_contacts.json")

# Seed default data on first run
_DEFAULT_CONTACTS = [
    {
        "name": "Sarah Varma",
        "relationship": "Daughter",
        "phone": "+1 (555) 234-5678",
        "is_primary": True
    },
    {
        "name": "Dr. Aris Thorne",
        "relationship": "Neurologist",
        "phone": "+1 (555) 987-6543",
        "is_primary": False
    },
]


def _seed_if_empty():
    if not _contacts_store.list():
        for c in _DEFAULT_CONTACTS:
            _contacts_store.create(c)


@router.get("", response_model=List[EmergencyContact])
async def list_emergency_contacts():
    _seed_if_empty()
    return _contacts_store.list()


@router.post("", response_model=EmergencyContact, status_code=201)
async def add_emergency_contact(contact: EmergencyContact):
    return _contacts_store.create(contact.model_dump())


@router.get("/{contact_id}", response_model=EmergencyContact)
async def get_emergency_contact(contact_id: str):
    item = _contacts_store.get(contact_id)
    if not item:
        raise HTTPException(status_code=404, detail="Contact not found")
    return item


@router.put("/{contact_id}", response_model=EmergencyContact)
async def update_emergency_contact(contact_id: str, contact: EmergencyContact):
    updated = _contacts_store.update(contact_id, contact.model_dump())
    if not updated:
        raise HTTPException(status_code=404, detail="Contact not found")
    return updated


@router.delete("/{contact_id}", status_code=204)
async def delete_emergency_contact(contact_id: str):
    if not _contacts_store.delete(contact_id):
        raise HTTPException(status_code=404, detail="Contact not found")
    return None
