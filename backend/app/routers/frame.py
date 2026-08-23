from fastapi import APIRouter, UploadFile, File, Form
import time
import logging
from typing import Optional, List, Dict, Any

from app.schemas import FrameProcessResponse
from app.services.object_service import object_detection_service
from app.services.face_service import face_service
from app.services import qdrant_service, context_cache, visual_memory
from app.routers.metrics import record_frame_upload, record_face_match, record_face_miss

router = APIRouter(prefix="/frame", tags=["Vision Pipeline"])
logger = logging.getLogger("neurotwin.frame")


@router.post("", response_model=FrameProcessResponse)
async def process_incoming_frame(
    file: Optional[UploadFile] = File(None),
    client_timestamp: Optional[str] = Form(None)
):
    start_time = time.time()
    image_bytes = await file.read() if file else b""

    # Store latest raw frame in memory for on-demand high-precision VLM queries
    if image_bytes:
        context_cache.store_latest_frame(image_bytes)

    # 1. Fast Real-Time Object Recognition (~15ms)
    detections = object_detection_service.detect(image_bytes) if image_bytes else []

    # 2. Face and Surface Glasses Verification
    matched, score, person_payload, face_detected, wearing_glasses, glasses_on_table = face_service.process_frame(
        image_bytes, detections=detections
    )

    # Format objects for mobile UI overlay
    detected_objects: List[Dict[str, Any]] = []
    object_labels: List[str] = []

    for d in detections:
        lbl = d.get("label", "")
        if lbl and lbl.lower() != "person":
            detected_objects.append(d)
            object_labels.append(lbl)

    if glasses_on_table:
        detected_objects.append({"class": "glasses", "label": "Reading Glasses", "confidence": 0.95})
        object_labels.append("Reading Glasses")

    glasses_location = "on face" if wearing_glasses else ("on table/desk" if glasses_on_table else "not visible")
    glasses_visible = wearing_glasses or glasses_on_table

    # Build live scene summary
    scene_summary = ""
    if face_detected:
        scene_summary = "Patient visible in front of camera"
    elif glasses_on_table:
        scene_summary = "Reading glasses resting on the table"
    elif object_labels:
        scene_summary = f"Viewing {', '.join(object_labels[:3])}"
    elif image_bytes:
        scene_summary = "Viewing table / room"

    # 3. Record in Visual Episodic Memory (Rolling 5-15 minute memory buffer)
    visual_memory.record_visual_observation(
        objects_detected=object_labels,
        scene_summary=scene_summary,
        glasses_location=glasses_location,
        glasses_visible=glasses_visible,
        person_present=face_detected,
    )

    # 4. Update Context Cache for Instant Voice Recall
    context_cache.store_visual_context(
        person=person_payload if matched else None,
        objects=detected_objects,
        face_detected=face_detected,
        person_present=face_detected,
        wearing_glasses=wearing_glasses,
        glasses_visible=glasses_visible,
        glasses_location=glasses_location,
        confidence=score,
        scene_summary=scene_summary,
    )

    processing_ms = round((time.time() - start_time) * 1000, 2)
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