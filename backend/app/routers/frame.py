from fastapi import APIRouter, UploadFile, File, Form
import time
from typing import Optional
from app.schemas import FrameProcessResponse

router = APIRouter(prefix="/frame", tags=["Vision Pipeline"])

# In-memory mock state for initial pipeline demonstration
MOCK_PERSON_PAYLOAD = {
    "person_id": "p_sarah_01",
    "name": "Sarah Varma",
    "relationship": "Daughter",
    "birthday": "1992-04-14",
    "recent_visit": "Yesterday at 3:30 PM",
    "memories": [
        "Brought blueberry muffins during her visit yesterday.",
        "Loves taking walks in the botanical garden with you."
    ],
    "favorite_songs": ["You Are My Sunshine", "Here Comes the Sun"],
    "hobbies": ["Gardening", "Baking pastries"]
}

@router.post("", response_model=FrameProcessResponse)
async def process_incoming_frame(
    file: Optional[UploadFile] = File(None),
    client_timestamp: Optional[str] = Form(None)
):
    start_time = time.time()
    
    # Simulate InsightFace embedding extraction & Qdrant vector search
    # In live execution: image bytes -> InsightFace 512d vector -> Qdrant cosine match
    processing_ms = round((time.time() - start_time) * 1000 + 42.5, 2)
    
    return FrameProcessResponse(
        matched=True,
        confidence=0.94,
        person=MOCK_PERSON_PAYLOAD,
        detected_objects=[
            {"class": "reading_glasses", "location": "Living Room Table", "confidence": 0.89}
        ],
        processing_time_ms=processing_ms
    )
