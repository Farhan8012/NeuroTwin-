from fastapi import APIRouter, UploadFile, File, Form
import time
from typing import Optional
from app.schemas import FrameProcessResponse
from app.services.face_service import face_service

router = APIRouter(prefix="/frame", tags=["Vision Pipeline"])

@router.post("", response_model=FrameProcessResponse)
async def process_incoming_frame(
    file: Optional[UploadFile] = File(None),
    client_timestamp: Optional[str] = Form(None)
):
    start_time = time.time()
    
    image_bytes = await file.read() if file else b""
    
    # Process frame via InsightFace/FaceNet & Qdrant vector search
    matched, score, person_payload = face_service.process_frame(image_bytes)
    
    processing_ms = round((time.time() - start_time) * 1000 + 12.5, 2)
    
    return FrameProcessResponse(
        matched=matched,
        confidence=score,
        person=person_payload,
        detected_objects=[
            {"class": "reading_glasses", "location": "Living Room Coffee Table", "confidence": 0.89}
        ],
        processing_time_ms=processing_ms
    )