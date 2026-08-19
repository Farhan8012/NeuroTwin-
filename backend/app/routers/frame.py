from fastapi import APIRouter, UploadFile, File, Form
import time
import uuid
from datetime import datetime, timezone
from typing import Optional
from app.schemas import FrameProcessResponse
from app.services.face_service import face_service
from app.services.object_service import object_detection_service
from app.services import qdrant_service, context_cache
from app.routers.metrics import record_frame_upload, record_face_match, record_face_miss

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

    # 3. Object detection via YOLOv8-nano
    detections = object_detection_service.detect(image_bytes)
    detected_objects = []
    for det in detections:
        obj_id = f"obj_{det['object_class']}_{uuid.uuid4().hex[:6]}"
        vector = object_detection_service.generate_object_embedding(image_bytes, det["bbox"])
        qdrant_service.upsert_object(
            obj_id,
            vector=vector,
            payload={
                "object_class": det["object_class"],
                "label": det["label"],
                "confidence": det["confidence"],
                "last_seen_timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            },
        )
        detected_objects.append({"class": det["object_class"], "label": det["label"], "confidence": det["confidence"]})

    processing_ms = round((time.time() - start_time) * 1000, 2)

    # Record metrics
    record_frame_upload(time.time() - start_time)
    if matched:
        record_face_match()
    else:
        record_face_miss()

    return FrameProcessResponse(
        matched=matched,
        confidence=score,
        person=person_payload,
        detected_objects=detected_objects,
        processing_time_ms=processing_ms,
    )