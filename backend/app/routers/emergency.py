from fastapi import APIRouter, HTTPException
from typing import List
from app.schemas import EmergencyContact
from app.services.json_store import JSONStore

router = APIRouter(prefix="/emergency-contacts", tags=["Caregiver - Emergency Contacts"])

_contacts_store = JSONStore("emergency_contacts.json")


@router.get("", response_model=List[EmergencyContact])
async def list_emergency_contacts():
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
