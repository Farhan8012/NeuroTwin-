from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


# --- Person & Memory Schemas ---
class MemoryCreate(BaseModel):
    title: str
    description: str
    person_id: Optional[str] = None
    event_date: Optional[str] = None
    category: Optional[str] = "story"  # story, life_event, song, place, hobby


class PersonCreate(BaseModel):
    name: str
    relationship: str
    birthday: Optional[str] = None
    memories: List[str] = []
    important_life_events: List[str] = []
    favorite_songs: List[str] = []
    favorite_places: List[str] = []
    hobbies: List[str] = []
    family_stories: List[str] = []


class PersonResponse(PersonCreate):
    id: str
    created_at: str
    updated_at: str
    vector_status: str = "pending"
    photo_urls: List[str] = []
    similarity_score: Optional[float] = None


class PersonUpdate(BaseModel):
    name: Optional[str] = None
    relationship: Optional[str] = None
    birthday: Optional[str] = None
    memories: Optional[List[str]] = None
    important_life_events: Optional[List[str]] = None
    favorite_songs: Optional[List[str]] = None
    favorite_places: Optional[List[str]] = None
    hobbies: Optional[List[str]] = None
    family_stories: Optional[List[str]] = None


# --- Object Tracking Schemas ---
class ObjectLocationLog(BaseModel):
    object_class: str
    label: str
    last_seen_location: str
    timestamp: str
    confidence: float
    ble_tag_id: Optional[str] = None


class ObjectLogCreate(BaseModel):
    object_class: str
    label: str
    last_seen_location: str
    confidence: float = 0.9
    ble_tag_id: Optional[str] = None


# --- Frame & Voice Query Schemas ---
class FrameProcessResponse(BaseModel):
    matched: bool
    confidence: float
    person: Optional[dict] = None
    detected_objects: List[dict] = []
    processing_time_ms: float


class VoiceQueryRequest(BaseModel):
    patient_query: str
    visual_context: Optional[dict] = None


class VoiceQueryResponse(BaseModel):
    transcript: str
    llm_response: str
    persona: str = "Warm Cognitive Companion"
    tts_audio_url: Optional[str] = None
    processing_time_ms: float


# --- Medical & Emergency Schemas ---
class MedicineItem(BaseModel):
    id: str
    name: str
    dosage: str
    schedule_time: str
    instructions: str


class EmergencyContact(BaseModel):
    id: str
    name: str
    relationship: str
    phone: str
    is_primary: bool = False