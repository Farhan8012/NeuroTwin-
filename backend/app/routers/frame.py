from fastapi import APIRouter, UploadFile, File, Form
import time
import uuid
from datetime import datetime, timezone
from typing import Optional
from app.schemas import FrameProcessResponse
from app.services.face_service import face_service
from app.services import qdrant_service
from app.services import context_cache

router = APIRouter(prefix="/frame", tags=["Vision Pipeline"])


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


@router.post("", response_model=FrameProcessResponse)
async def process_incoming_frame(
    file: Optional[UploadFile] = File(None),
    client_timestamp: Optional[str] = Form(None)
):
    start_time = time.time()

    image_bytes = await file.read() if file else b""

    # 1. Process frame via InsightFace & Qdrant vector search
    matched, score, person_payload = face_service.process_frame(image_bytes)

    # 2. Cache the visual context for the next voice query (TTL-based)
    if matched and person_payload:
        context_cache.store_visual_context(person=person_payload, objects=[])

    # 3. Track detected objects in Qdrant (placeholder objects for now)
    detected_objects = []
    object_detections = [
        {"class": "reading_glasses", "label": "Blue Reading Glasses", "location": "Living Room Coffee Table", "confidence": 0.89},
    ]
    for obj in object_detections:
        obj_id = f"obj_{obj['class']}_{uuid.uuid4().hex[:6]}"
        qdrant_service.upsert_object(
            obj_id,
            vector=[0.0] * 128,  # placeholder embedding; real YOLO integration pending
            payload={
                "object_class": obj["class"],
                "label": obj["label"],
                "last_seen_location": obj["location"],
                "last_seen_timestamp": _now_iso(),
                "confidence": obj["confidence"],
            },
        )
        detected_objects.append(obj)

    processing_ms = round((time.time() - start_time) * 1000, 2)

    return FrameProcessResponse(
        matched=matched,
        confidence=score,
        person=person_payload,
        detected_objects=detected_objects,
        processing_time_ms=processing_ms,
    )