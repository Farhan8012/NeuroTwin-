from fastapi import APIRouter, HTTPException
from typing import List
from datetime import datetime
from app.schemas import PersonCreate, PersonResponse

router = APIRouter(prefix="/people", tags=["Caregiver - People Management"])

# In-memory storage mock
PEOPLE_DB = [
    {
        "id": "p_sarah_01",
        "name": "Sarah Varma",
        "relationship": "Daughter",
        "birthday": "1992-04-14",
        "photos": ["/photos/sarah_1.jpg", "/photos/sarah_2.jpg"],
        "memories": ["Brought blueberry muffins yesterday.", "Loves Lake Tahoe hikes."],
        "important_life_events": ["Graduated law school in 2016.", "Married Mark in 2020."],
        "favorite_songs": ["You Are My Sunshine", "Here Comes the Sun"],
        "favorite_places": ["San Francisco Botanical Garden"],
        "hobbies": ["Gardening", "Baking pastries"],
        "family_stories": ["Caught her first fish at Lake Tahoe when she was 8."],
        "created_at": "2026-08-19T10:00:00Z",
        "updated_at": "2026-08-19T12:00:00Z"
    },
    {
        "id": "p_aris_02",
        "name": "Dr. Aris Thorne",
        "relationship": "Primary Doctor",
        "birthday": "1980-09-22",
        "photos": ["/photos/dr_thorne.jpg"],
        "memories": ["Weekly checkup every Tuesday morning."],
        "important_life_events": ["Chief of Neurology at City Hospital."],
        "favorite_songs": [],
        "favorite_places": ["City Clinic"],
        "hobbies": ["Chess"],
        "family_stories": [],
        "created_at": "2026-08-19T11:00:00Z",
        "updated_at": "2026-08-19T11:00:00Z"
    }
]

@router.get("", response_model=List[PersonResponse])
async def list_people():
    return PEOPLE_DB

@router.post("", response_model=PersonResponse)
async def create_person(person: PersonCreate):
    new_id = f"p_{len(PEOPLE_DB) + 1:02d}"
    now_str = datetime.utcnow().isoformat() + "Z"
    
    new_person = {
        "id": new_id,
        "created_at": now_str,
        "updated_at": now_str,
        **person.dict()
    }
    PEOPLE_DB.append(new_person)
    return new_person

@router.get("/{person_id}", response_model=PersonResponse)
async def get_person(person_id: str):
    for p in PEOPLE_DB:
        if p["id"] == person_id:
            return p
    raise HTTPException(status_code=404, detail="Person profile not found")
