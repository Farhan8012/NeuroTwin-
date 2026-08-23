from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class Config:
    json_schema_extra = {
        "example": {}
    }


# --- Person & Memory Schemas ---
class MemoryCreate(BaseModel):
    title: str = Field(..., description="Short title for the memory anchor", example="Graduated law school")
    description: str = Field(..., description="Detailed description of the memory", example="Attended commencement ceremony in San Francisco in 2016")
    person_id: Optional[str] = Field(None, description="Binding to a registered person ID", example="p_102")
    event_date: Optional[str] = Field(None, description="Date of the event", example="2016-05-20")
    category: Optional[str] = Field("story", description="Memory category: story, life_event, song, place, hobby, anecdote", example="life_event")


class PersonCreate(BaseModel):
    name: str = Field(..., description="Full name of the person", example="Sarah Varma")
    relationship: str = Field(..., description="Relationship to the patient", example="Daughter")
    birthday: Optional[str] = Field(None, description="Birthday (YYYY-MM-DD)", example="1992-04-14")
    memories: List[str] = Field(default=[], description="Recent memories about this person", example=["Brought blueberry muffins yesterday"]) 
    important_life_events: List[str] = Field(default=[], description="Major life events", example=["Graduated law school in 2016"]) 
    favorite_songs: List[str] = Field(default=[], description="Songs that comfort the patient", example=["You Are My Sunshine"]) 
    favorite_places: List[str] = Field(default=[], description="Meaningful places", example=["San Francisco Botanical Garden"]) 
    hobbies: List[str] = Field(default=[], description="Shared hobbies", example=["Gardening", "Baking pastries"]) 
    family_stories: List[str] = Field(default=[], description="Family anecdotes for warmth", example=["Sarah caught her first fish at age 8"]) 

    model_config = {
        "json_schema_extra": {
            "examples": [{
                "name": "Sarah Varma",
                "relationship": "Daughter",
                "birthday": "1992-04-14",
                "memories": ["Brought blueberry muffins yesterday"],
                "hobbies": ["Gardening", "Baking pastries"]
            }]
        }
    }


class PersonResponse(PersonCreate):
    id: str = Field(..., description="Unique person identifier", example="p_102")
    created_at: str = Field(..., description="Creation timestamp (ISO 8601)", example="2026-08-19T12:00:00Z")
    updated_at: str = Field(..., description="Last update timestamp (ISO 8601)", example="2026-08-19T12:00:00Z")
    vector_status: str = Field("pending", description="Face vector status: pending, indexed, no_face_detected", example="indexed")
    photo_urls: List[str] = Field(default=[], description="Uploaded reference photo URLs", example=["/static/photos/abc123_sarah.jpg"]) 
    similarity_score: Optional[float] = Field(None, description="Cosine similarity score (if matched)", example=0.92)


class PersonUpdate(BaseModel):
    name: Optional[str] = Field(None, example="Sarah Varma")
    relationship: Optional[str] = Field(None, example="Daughter")
    birthday: Optional[str] = Field(None, example="1992-04-14")
    memories: Optional[List[str]] = Field(None, example=["Brought muffins"]) 
    important_life_events: Optional[List[str]] = Field(None, example=["Graduated 2016"]) 
    favorite_songs: Optional[List[str]] = Field(None, example=["You Are My Sunshine"]) 
    favorite_places: Optional[List[str]] = Field(None, example=["Botanical Garden"]) 
    hobbies: Optional[List[str]] = Field(None, example=["Gardening"]) 
    family_stories: Optional[List[str]] = Field(None, example=["First fish at Tahoe"]) 


# --- Object Tracking Schemas ---
class ObjectLocationLog(BaseModel):
    object_class: str = Field(..., example="reading_glasses")
    label: str = Field(..., example="Blue Reading Glasses")
    last_seen_location: str = Field(..., example="Living Room Coffee Table")
    timestamp: str = Field(..., example="2026-08-19T16:45:00Z")
    confidence: float = Field(..., example=0.94)
    ble_tag_id: Optional[str] = Field(None, example="BLE-GLASSES-001")


class ObjectLogCreate(BaseModel):
    object_class: str = Field(..., example="reading_glasses")
    label: str = Field(..., example="Blue Reading Glasses")
    last_seen_location: str = Field(..., example="Living Room Coffee Table")
    confidence: float = Field(0.9, example=0.94)
    ble_tag_id: Optional[str] = Field(None, example="BLE-GLASSES-001")


# --- Frame & Voice Query Schemas ---
class FrameProcessResponse(BaseModel):
    matched: bool = Field(..., description="Whether a known person was matched", example=True)
    confidence: float = Field(..., description="Cosine similarity score (0-1)", example=0.92)
    person: Optional[dict] = Field(None, description="Matched person payload (name, relationship, memories)", example={"name": "Sarah Varma", "relationship": "Daughter", "memories": ["Brought muffins"]}) 
    detected_objects: List[dict] = Field(default=[], description="Objects detected by YOLO", example=[{"class": "phone", "label": "Phone", "confidence": 0.87}]) 
    processing_time_ms: float = Field(..., description="Total processing time in milliseconds", example=569.43)


class VoiceQueryRequest(BaseModel):
    patient_query: str = Field(..., description="Patient's spoken question (transcribed or typed)", example="Who is she?")
    visual_context: Optional[dict] = Field(None, description="Visual context from last frame (optional)", example={"name": "Sarah Varma", "relationship": "Daughter"}) 

    model_config = {
        "json_schema_extra": {
            "examples": [{
                "patient_query": "Who is she?",
                "visual_context": {"name": "Sarah Varma", "relationship": "Daughter"}
            }]
        }
    }


class VoiceQueryResponse(BaseModel):
    transcript: str = Field(..., description="The patient's query text", example="Who is she?")
    llm_response: str = Field(..., description="Warm companion response from LLM", example="That is your daughter Sarah. She visited you yesterday and brought your favorite blueberry muffins.")
    persona: str = Field("Warm Cognitive Companion", description="LLM persona name", example="Warm Cognitive Companion")
    tts_audio_url: Optional[str] = Field(None, description="URL of generated TTS WAV audio", example="/static/audio/response_19ce09b8.wav")
    processing_time_ms: float = Field(..., description="Total processing time in milliseconds", example=15285.32)

    model_config = {
        "json_schema_extra": {
            "examples": [{
                "transcript": "Who is she?",
                "llm_response": "That is your daughter Sarah. She visited you yesterday and brought your favorite blueberry muffins.",
                "persona": "Warm Cognitive Companion",
                "tts_audio_url": "/static/audio/response_19ce09b8.wav",
                "processing_time_ms": 15285.32
            }]
        }
    }


# --- Medical & Emergency Schemas ---
class MedicineItem(BaseModel):
    id: str = Field("", description="Medicine ID (auto-generated if empty)", example="")
    name: str = Field(..., description="Medicine name", example="Donepezil")
    dosage: str = Field(..., description="Dosage amount and unit", example="10 mg")
    schedule_time: str = Field(..., description="When to take the medicine", example="08:00 AM Daily")
    instructions: str = Field(..., description="Special instructions", example="Take with breakfast water. Report any nausea.")

    model_config = {
        "json_schema_extra": {
            "examples": [{
                "name": "Donepezil",
                "dosage": "10 mg",
                "schedule_time": "08:00 AM Daily",
                "instructions": "Take with breakfast water"
            }]
        }
    }


class EmergencyContact(BaseModel):
    id: str = Field("", description="Contact ID (auto-generated if empty)", example="")
    name: str = Field(..., description="Contact full name", example="Sarah Varma")
    relationship: str = Field(..., description="Relationship to patient", example="Daughter")
    phone: str = Field(..., description="Phone number", example="+1 (555) 234-5678")
    is_primary: bool = Field(False, description="Whether this is the primary emergency contact", example=True)

    model_config = {
        "json_schema_extra": {
            "examples": [{
                "name": "Sarah Varma",
                "relationship": "Daughter",
                "phone": "+1 (555) 234-5678",
                "is_primary": True
            }]
        }
    }


# --- Photo Album Schemas ---
class AlbumCreate(BaseModel):
    title: str = Field(..., description="Album title", example="Lake Tahoe Summer 1974")
    description: Optional[str] = Field(None, description="Album description", example="Family trip to Lake Tahoe")
    date: Optional[str] = Field(None, description="Album date (YYYY-MM-DD)", example="1974-07-15")
    people_ids: List[str] = Field(default=[], description="IDs of people associated with this album", example=["p_102"])
    photo_urls: List[str] = Field(default=[], description="URLs of photos in this album", example=[])
    featured_memory_id: Optional[str] = Field(None, description="ID of the featured memory for this album", example=None)

    model_config = {
        "json_schema_extra": {
            "examples": [{
                "title": "Lake Tahoe Summer 1974",
                "description": "Family trip to Lake Tahoe with Sarah and Thomas",
                "date": "1974-07-15",
                "people_ids": [],
                "photo_urls": [],
            }]
        }
    }


class AlbumUpdate(BaseModel):
    title: Optional[str] = Field(None, example="Lake Tahoe Summer 1974")
    description: Optional[str] = Field(None, example="Family trip")
    date: Optional[str] = Field(None, example="1974-07-15")
    people_ids: Optional[List[str]] = Field(None, example=[])
    photo_urls: Optional[List[str]] = Field(None, example=[])
    featured_memory_id: Optional[str] = Field(None, example=None)