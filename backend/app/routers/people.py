from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import List, Optional

from app.config import settings
from app.schemas import PersonCreate, PersonResponse
from app.services import face_service, qdrant_service, people_store

router = APIRouter(prefix="/people", tags=["Caregiver - People Management"])


async def _save_photo(file: UploadFile) -> str:
    settings.PHOTO_OUT_DIR.mkdir(parents=True, exist_ok=True)
    safe = file.filename.replace(" ", "_").replace("/", "_")
    path = settings.PHOTO_OUT_DIR / f"{__import__('uuid').uuid4().hex[:8]}_{safe}"
    path.write_bytes(await file.read())
    return f"/static/photos/{path.name}"


def _save_photo_bytes(filename: str, data: bytes) -> str:
    settings.PHOTO_OUT_DIR.mkdir(parents=True, exist_ok=True)
    safe = filename.replace(" ", "_").replace("/", "_")
    path = settings.PHOTO_OUT_DIR / f"{__import__('uuid').uuid4().hex[:8]}_{safe}"
    path.write_bytes(data)
    return f"/static/photos/{path.name}"


def _index_embedding(photo_bytes: bytes) -> Optional[List[float]]:
    return face_service.extract_embedding(photo_bytes)


@router.get("", response_model=List[PersonResponse])
async def list_people():
    people = people_store.list_people()
    indexed = qdrant_service.list_people_points()
    indexed_map = {p["person_id"]: p for p in indexed}

    result = []
    for p in people:
        rec = {**p}
        if p["id"] in indexed_map:
            rec["vector_status"] = "indexed"
            rec["similarity_score"] = None
        result.append(PersonResponse(**rec))

    # Include any indexed vectors with no registry entry (e.g. legacy seed data)
    for person_id, payload in indexed_map.items():
        if not any(p.id == person_id for p in result):
            result.append(PersonResponse(
                id=person_id,
                name=payload.get("name", person_id),
                relationship=payload.get("relationship", "Unknown"),
                birthday=payload.get("birthday"),
                memories=payload.get("memories", []),
                important_life_events=payload.get("important_life_events", []),
                favorite_songs=payload.get("favorite_songs", []),
                favorite_places=payload.get("favorite_places", []),
                hobbies=payload.get("hobbies", []),
                family_stories=payload.get("family_stories", []),
                photo_urls=payload.get("photo_urls", []),
                vector_status="indexed",
                created_at=payload.get("created_at", ""),
                updated_at=payload.get("updated_at", ""),
            ))
    return result


@router.post("", response_model=PersonResponse)
async def create_person(payload: PersonCreate):
    """Register a new person profile (JSON body). Optionally attach photos via
    multipart on `/people/with-photo` to also index face vectors."""
    person = people_store.create_person(payload.model_dump())
    return PersonResponse(**person)


@router.post("/with-photo", response_model=PersonResponse)
async def create_person_with_photo(
    name: str = Form(...),
    relationship: str = Form(...),
    birthday: Optional[str] = Form(None),
    memory: Optional[str] = Form(None),
    photos: List[UploadFile] = File(...),
):
    """Multipart registration: saves photos, generates InsightFace embedding,
    and indexes the 512-d vector into Qdrant."""
    photo_urls: List[str] = []
    embedding: Optional[List[float]] = None

    for photo in photos:
        bytes_ = await photo.read()
        url = _save_photo_bytes(photo.filename or "photo.jpg", bytes_)
        photo_urls.append(url)
        if embedding is None:
            embedding = _index_embedding(bytes_)

    person = people_store.create_person({
        "name": name,
        "relationship": relationship,
        "birthday": birthday,
        "memories": [memory] if memory else [],
        "photo_urls": photo_urls,
    })

    if embedding is not None:
        payload = {k: v for k, v in person.items() if k != "id"}
        payload["photo_urls"] = photo_urls
        qdrant_service.upsert_person_embedding(person["id"], embedding, payload)
        person = people_store.update_person(person["id"], {"vector_status": "indexed"})
    else:
        person = people_store.update_person(person["id"], {"vector_status": "no_face_detected"})

    return PersonResponse(**person)


@router.get("/{person_id}", response_model=PersonResponse)
async def get_person(person_id: str):
    person = people_store.get_person(person_id)
    if not person:
        raise HTTPException(status_code=404, detail="Person profile not found")
    return PersonResponse(**person)


@router.put("/{person_id}", response_model=PersonResponse)
async def update_person(person_id: str, payload: PersonCreate):
    person = people_store.update_person(person_id, payload.model_dump())
    if not person:
        raise HTTPException(status_code=404, detail="Person profile not found")
    return PersonResponse(**person)


@router.delete("/{person_id}", status_code=204)
async def delete_person(person_id: str):
    """Full purge — removes the profile AND all indexed face vectors from Qdrant
    (right to be forgotten, see 10 - Privacy and Ethics)."""
    if not people_store.delete_person(person_id):
        raise HTTPException(status_code=404, detail="Person profile not found")
    qdrant_service.delete_person_vectors(person_id)
    return None