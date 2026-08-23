"""Object detection service using YOLOv8-nano for household item & person recognition.

Detects common household items, furniture, electronics, and persons in the camera stream.
"""

import logging
import io
from typing import List, Dict, Any, Optional
from pathlib import Path
from PIL import Image

from app.config import settings

logger = logging.getLogger("neurotwin.objects")

# Clean human-friendly labels for common COCO classes
LABEL_MAP = {
    "person": "Person",
    "chair": "Chair",
    "couch": "Couch / Sofa",
    "bed": "Bed",
    "dining table": "Table",
    "tv": "Television",
    "laptop": "Laptop",
    "mouse": "Computer Mouse",
    "remote": "Remote Control",
    "keyboard": "Keyboard",
    "cell phone": "Phone",
    "cup": "Cup / Mug",
    "bottle": "Water Bottle",
    "wine glass": "Glass",
    "book": "Book",
    "clock": "Clock",
    "vase": "Vase",
    "scissors": "Scissors",
    "backpack": "Bag / Backpack",
    "handbag": "Handbag / Purse",
    "potted plant": "Potted Plant",
    "sink": "Sink",
    "refrigerator": "Refrigerator",
    "bowl": "Bowl",
    "fork": "Fork",
    "knife": "Knife",
    "spoon": "Spoon",
    "umbrella": "Umbrella",
    "tie": "Tie",
    "suitcase": "Suitcase",
}

_model = None


def _get_model():
    """Lazy-load YOLOv8-nano model from local weights."""
    global _model
    if _model is None:
        try:
            from ultralytics import YOLO

            model_path = settings.MODELS_DIR / "yolov8n.pt"
            if model_path.exists():
                _model = YOLO(str(model_path))
                logger.info("YOLOv8-nano loaded from %s", model_path)
            else:
                _model = YOLO("yolov8n.pt")
                logger.info("YOLOv8-nano loaded")
        except Exception as e:
            logger.warning("YOLO model load error: %s", e)
            _model = False
    return _model if _model is not False else None


class ObjectDetectionService:
    """Detects household objects and persons in camera frames using YOLOv8-nano."""

    def detect(self, image_bytes: bytes) -> List[Dict[str, Any]]:
        """Run YOLO inference on image bytes.

        Returns a list of detected objects with class, confidence, label, and bounding box.
        """
        if not image_bytes:
            return []

        model = _get_model()
        if model is None:
            return []

        try:
            image = Image.open(io.BytesIO(image_bytes))
            results = model(image, conf=0.25, verbose=False)

            detections = []
            for result in results:
                boxes = result.boxes
                if boxes is None:
                    continue
                for box in boxes:
                    cls_id = int(box.cls[0])
                    cls_name = model.names.get(cls_id, "").lower()
                    conf = float(box.conf[0])

                    label = LABEL_MAP.get(cls_name, cls_name.title())
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    detections.append({
                        "object_class": cls_name,
                        "label": label,
                        "confidence": round(conf, 3),
                        "bbox": [round(x1), round(y1), round(x2), round(y2)],
                    })

            return detections

        except Exception as e:
            logger.warning("YOLO detection failed: %s", e)
            return []

    def generate_object_embedding(self, image_bytes: bytes, bbox: List[int]) -> List[float]:
        """Generate a simple 128-d embedding for a detected object crop."""
        try:
            image = Image.open(io.BytesIO(image_bytes))
            x1, y1, x2, y2 = bbox
            crop = image.crop((max(0, x1), max(0, y1), min(image.width, x2), min(image.height, y2))).resize((32, 32))
            import numpy as np
            arr = np.array(crop).astype(np.float32).flatten()[:128]

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
