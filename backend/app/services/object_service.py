"""Object detection service using YOLOv8-nano for household item recognition.

Detects common objects like glasses, keys, phones, remote controls, etc.
Embeds detections into the Qdrant objects collection for location tracking.
"""

import logging
import io
from typing import List, Dict, Any, Optional
from pathlib import Path

import numpy as np
from PIL import Image

from app.config import settings

logger = logging.getLogger(__name__)

# Common household objects we care about for memory-impaired patients
TARGET_CLASSES = {
    "cell phone": "phone",
    "remote": "remote_control",
    "book": "book",
    "cup": "cup",
    "bottle": "bottle",
    "scissors": "scissors",
    "chair": "chair",
    "potted plant": "potted_plant",
    "tv": "television",
    "laptop": "laptop",
}

# Display-friendly labels
LABEL_MAP = {
    "phone": "Phone",
    "remote_control": "Remote Control",
    "book": "Book",
    "cup": "Cup",
    "bottle": "Bottle",
    "scissors": "Scissors",
    "chair": "Chair",
    "potted_plant": "Potted Plant",
    "television": "Television",
    "laptop": "Laptop",
    "reading_glasses": "Reading Glasses",
    "keys": "Keys",
    "wallet": "Wallet",
}

_model = None


def _get_model():
    """Lazy-load YOLOv8-nano model."""
    global _model
    if _model is None:
        try:
            from ultralytics import YOLO

            model_path = settings.MODELS_DIR / "yolov8n.pt"
            model_path.parent.mkdir(parents=True, exist_ok=True)

            # Ultralytics auto-downloads if not present
            _model = YOLO("yolov8n.pt")
            logger.info("YOLOv8-nano loaded")
        except Exception as e:
            logger.warning("YOLO unavailable, object detection disabled: %s", e)
            _model = False  # sentinel
    return _model if _model is not False else None


class ObjectDetectionService:
    """Detects household objects in camera frames using YOLOv8-nano."""

    def detect(self, image_bytes: bytes) -> List[Dict[str, Any]]:
        """Run YOLO inference on image bytes.

        Returns a list of detected objects with class, confidence, and bounding box.
        """
        model = _get_model()
        if model is None:
            return []

        try:
            image = Image.open(io.BytesIO(image_bytes))
            results = model(image, conf=0.3, verbose=False)

            detections = []
            for result in results:
                boxes = result.boxes
                if boxes is None:
                    continue
                for box in boxes:
                    cls_id = int(box.cls[0])
                    cls_name = model.names.get(cls_id, "").lower()
                    conf = float(box.conf[0])

                    if cls_name in TARGET_CLASSES:
                        obj_class = TARGET_CLASSES[cls_name]
                        x1, y1, x2, y2 = box.xyxy[0].tolist()
                        detections.append({
                            "object_class": obj_class,
                            "label": LABEL_MAP.get(obj_class, cls_name.title()),
                            "confidence": round(conf, 3),
                            "bbox": [round(x1), round(y1), round(x2), round(y2)],
                        })

            return detections

        except Exception as e:
            logger.warning("YOLO detection failed: %s", e)
            return []

    def generate_object_embedding(self, image_bytes: bytes, bbox: List[int]) -> List[float]:
        """Generate a simple 128-d embedding for a detected object crop.

        Uses normalized pixel features as a placeholder. Real integration would
        use a trained embedding model for object re-identification.
        """
        try:
            image = Image.open(io.BytesIO(image_bytes))
            x1, y1, x2, y2 = bbox
            crop = image.crop((x1, y1, x2, y2)).resize((32, 32))
            arr = np.array(crop).astype(np.float32).flatten()[:128]

            # Pad to exactly 128 dimensions if needed
            if len(arr) < 128:
                arr = np.pad(arr, (0, 128 - len(arr)))
            elif len(arr) > 128:
                arr = arr[:128]

            norm = np.linalg.norm(arr)
            if norm > 0:
                arr = arr / norm
            return arr.tolist()
        except Exception:
            return [0.0] * 128


object_detection_service = ObjectDetectionService()
