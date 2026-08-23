"""Multimodal Vision Language Model (VLM) Service.

Multi-tier Vision AI:
1. Google Gemini 3.1 Flash Lite (High quota, human-level detail for laptops, USB drives, stickers, glasses, medicines, books).
2. Google Gemini Flash Latest / 3.5 Flash Lite.
3. Groq Cloud Vision (Qwen-3.6-27b).
4. Local YOLOv8 + OpenCV fallback.
"""

import logging
import io
import base64
import json
import re
import os
import time
import requests
from typing import Dict, Any, List, Optional
from PIL import Image

from app.config import settings
from app.services.object_service import object_detection_service
from app.services.face_service import face_service

logger = logging.getLogger("neurotwin.vlm")

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_VISION_MODEL = "qwen/qwen3.6-27b"

VISION_SYSTEM_PROMPT = """You are an expert AI vision perception system for an assistive companion device.
Analyze this live camera view accurately and truthfully in high detail.

Return ONLY a valid JSON object with these exact keys:
{
  "person_present": boolean (true ONLY if a human is in view),
  "wearing_glasses": boolean (true ONLY if reading glasses/spectacles are on the person's face),
  "glasses_visible": boolean (true if eyeglasses/reading glasses are visible anywhere, including on a desk, table, or surface),
  "glasses_location": "on face" | "on table/desk" | "not visible",
  "objects_detected": ["exact", "list", "of", "items", "e.g.", "laptop", "router", "reading glasses", "phone", "desk", "cables", "stickers"],
  "scene_summary": "1-2 detailed, accurate sentences describing exactly what the camera sees"
}
"""


def _clean_vlm_text(text: str) -> str:
    if not text:
        return ""
    cleaned = re.sub(r"<think>[\s\S]*?</think>", "", text, flags=re.IGNORECASE).strip()
    if "<think>" in cleaned.lower():
        cleaned = re.sub(r"<think>[\s\S]*", "", cleaned, flags=re.IGNORECASE).strip()
    if "</think>" in cleaned.lower():
        cleaned = re.sub(r"[\s\S]*?</think>", "", cleaned, flags=re.IGNORECASE).strip()
    return cleaned.strip()


class VisionLanguageService:
    """Multimodal vision perception service providing detailed, accurate scene analysis."""

    def _call_gemini_vision(self, image_bytes: bytes) -> Optional[Dict[str, Any]]:
        """Call Google Gemini Flash Vision with fallback across active model tiers."""
        api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
        if not api_key:
            return None

        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=api_key)

            img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            img.thumbnail((640, 640))
            buf = io.BytesIO()
            img.save(buf, format="JPEG", quality=85)
            jpeg_data = buf.getvalue()

            candidate_models = [
                "gemini-3.1-flash-lite",
                "gemini-flash-lite-latest",
                "gemini-3.5-flash-lite",
                "gemini-flash-latest",
            ]

            for model_name in candidate_models:
                try:
                    response = client.models.generate_content(
                        model=model_name,
                        contents=[
                            types.Part.from_bytes(data=jpeg_data, mime_type="image/jpeg"),
                            VISION_SYSTEM_PROMPT
                        ]
                    )

                    if response and response.text:
                        cleaned = _clean_vlm_text(response.text)
                        match = re.search(r"\{[\s\S]*\}", cleaned)
                        if match:
                            data = json.loads(match.group(0))
                            logger.info("Gemini Vision (%s) analysis succeeded: %s", model_name, data.get("scene_summary", "")[:60])
                            return {
                                "person_present": bool(data.get("person_present", False)),
                                "wearing_glasses": bool(data.get("wearing_glasses", False)),
                                "glasses_visible": bool(data.get("glasses_visible", False)),
                                "glasses_location": str(data.get("glasses_location", "not visible")),
                                "objects_detected": list(data.get("objects_detected", [])),
                                "scene_summary": str(data.get("scene_summary", "")),
                            }
                except Exception as model_err:
                    err_str = str(model_err)
                    if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                        logger.debug("Gemini model %s quota exceeded, trying next model...", model_name)
                        continue
                    elif "404" in err_str:
                        continue
                    else:
                        logger.debug("Gemini %s error: %s", model_name, model_err)
        except Exception as e:
            logger.warning("Gemini Vision client initialization failed: %s", e)

        return None

    def _call_groq_vision(self, image_bytes: bytes) -> Optional[Dict[str, Any]]:
        """Call Groq Cloud Multimodal Vision (Qwen-3.6 / Qwen-2.5-VL)."""
        if not settings.GROQ_API_KEY:
            return None

        try:
            img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            img.thumbnail((480, 480))
            buf = io.BytesIO()
            img.save(buf, format="JPEG", quality=80)
            b64_img = base64.b64encode(buf.getvalue()).decode("utf-8")

            headers = {
                "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                "Content-Type": "application/json",
            }

            payload = {
                "model": GROQ_VISION_MODEL,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": VISION_SYSTEM_PROMPT},
                            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64_img}"}}
                        ]
                    }
                ],
                "temperature": 0.1,
                "max_tokens": 300,
            }

            resp = requests.post(GROQ_API_URL, headers=headers, json=payload, timeout=6.0)
            if resp.status_code == 200:
                raw = resp.json()["choices"][0]["message"]["content"]
                cleaned = _clean_vlm_text(raw)
                match = re.search(r"\{[\s\S]*\}", cleaned)
                if match:
                    data = json.loads(match.group(0))
                    logger.info("Groq VLM analysis succeeded: %s", data.get("scene_summary", "")[:60])
                    return {
                        "person_present": bool(data.get("person_present", False)),
                        "wearing_glasses": bool(data.get("wearing_glasses", False)),
                        "glasses_visible": bool(data.get("glasses_visible", False)),
                        "glasses_location": str(data.get("glasses_location", "not visible")),
                        "objects_detected": list(data.get("objects_detected", [])),
                        "scene_summary": str(data.get("scene_summary", "")),
                    }
        except Exception as e:
            logger.debug("Groq VLM vision call failed: %s", e)

        return None

    def analyze_frame(self, image_bytes: bytes) -> Dict[str, Any]:
        """Analyze frame using Gemini Multi-Tier -> Groq VLM -> Local YOLO fallback."""
        if not image_bytes:
            return {
                "person_present": False,
                "wearing_glasses": False,
                "glasses_visible": False,
                "glasses_location": "not visible",
                "objects_detected": [],
                "scene_summary": "Camera active, no visual input",
            }

        # 1. Primary: Google Gemini Multi-Tier Flash Vision
        gemini_res = self._call_gemini_vision(image_bytes)
        if gemini_res:
            return gemini_res

        # 2. Secondary: Groq Cloud Vision (Qwen-3.6 / Qwen-2.5-VL)
        groq_res = self._call_groq_vision(image_bytes)
        if groq_res:
            return groq_res

        # 3. Tertiary: Local YOLOv8 + Feature Extractor
        detections = object_detection_service.detect(image_bytes)
        matched, score, person_payload, face_detected, wearing_glasses, glasses_on_table = face_service.process_frame(
            image_bytes, detections=detections
        )

        objs = [d["label"] for d in detections if d.get("object_class") != "person"]
        if glasses_on_table:
            objs.append("Reading Glasses")

        summary = "Table / room view"
        if face_detected:
            summary = "Patient visible in front of camera"
        elif glasses_on_table:
            summary = "Reading glasses resting on table"
        elif objs:
            summary = f"Seeing {', '.join(objs[:3])}"

        return {
            "person_present": face_detected,
            "wearing_glasses": wearing_glasses,
            "glasses_visible": wearing_glasses or glasses_on_table,
            "glasses_location": "on face" if wearing_glasses else ("on table/desk" if glasses_on_table else "not visible"),
            "objects_detected": objs,
            "scene_summary": summary,
        }


vlm_service = VisionLanguageService()
