import requests
import json
import logging
from typing import Dict, Any, Optional
from app.config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT_PERSONA = """You are NeuroTwin, a warm, patient, and gentle AI cognitive companion for an elderly person experiencing memory impairment.

Rules:
1. Always maintain a calm, comforting, simple, and story-shaped tone.
2. Never sound like a cold database lookup or robot (e.g. NEVER say "Subject identified: ID #402").
3. Always reassure the patient using their personal context, family relationships, recent visits, and shared history.
4. Keep answers short (1 to 3 sentences maximum) so they are easy to listen to.
"""

class LLMCompanionService:
    """LLM reasoning service interfacing with Ollama (Qwen3-8B) or Groq Cloud API."""

    def generate_companion_response(
        self,
        patient_query: str,
        visual_context: Optional[Dict[str, Any]] = None
    ) -> str:
        """Assembles prompt context and queries local Ollama or Groq API."""
        
        person_name = visual_context.get("name", "Sarah Varma") if visual_context else "Sarah Varma"
        relationship = visual_context.get("relationship", "Daughter") if visual_context else "Daughter"
        recent_visit = visual_context.get("recent_visit", "Yesterday at 3:30 PM") if visual_context else "Yesterday"
        memories = visual_context.get("memories", ["Brought blueberry muffins yesterday"]) if visual_context else ["Brought blueberry muffins yesterday"]

        prompt_body = f"""
Visual Context:
- Active Person: {person_name} ({relationship})
- Last Visit: {recent_visit}
- Key Memory Notes: {', '.join(memories)}

Patient Spoken Query: "{patient_query}"

Generate a short, warm, comforting 2-sentence response for the patient:
"""

        # 1. Attempt Ollama Qwen3-8B local inference if available
        if settings.LLM_PROVIDER == "ollama":
            try:
                response = requests.post(
                    f"{settings.OLLAMA_BASE_URL}/api/generate",
                    json={
                        "model": settings.OLLAMA_MODEL,
                        "system": SYSTEM_PROMPT_PERSONA,
                        "prompt": prompt_body,
                        "stream": False
                    },
                    timeout=30.0
                )
                if response.status_code == 200:
                    text = response.json().get("response", "").strip()
                    if text:
                        return text
            except Exception as e:
                logger.warning(f"Ollama local LLM unavailable, using fallback persona response: {e}")

        # 2. Rule-assisted warm fallback persona
        query_lower = patient_query.lower()
        if "who" in query_lower:
            return f"This is your daughter {person_name}. She visited you yesterday afternoon and brought your favorite blueberry muffins."
        elif "glasses" in query_lower:
            return "Your blue reading glasses were last seen on the living room coffee table next to your book."
        elif "keys" in query_lower:
            return "Your keys are safely placed on the hook near the front door."
        else:
            return f"I am right here with you. Your daughter {person_name} is here and everything is safe and sound."

llm_service = LLMCompanionService()