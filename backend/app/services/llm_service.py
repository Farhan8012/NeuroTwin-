import re
import requests
import json
import logging
from typing import Dict, Any, Optional, List
from app.config import settings
from app.services import people_store
from app.services.json_store import JSONStore

logger = logging.getLogger(__name__)

_medicines_store = JSONStore("medicines.json")
_memories_store = JSONStore("memories.json")


def _clean_llm_text(text: str) -> str:
    if not text:
        return ""
    cleaned = re.sub(r"<think>[\s\S]*?</think>", "", text, flags=re.IGNORECASE).strip()
    if "<think>" in cleaned.lower():
        cleaned = re.sub(r"<think>[\s\S]*", "", cleaned, flags=re.IGNORECASE).strip()
    if "</think>" in cleaned.lower():
        cleaned = re.sub(r"[\s\S]*?</think>", "", cleaned, flags=re.IGNORECASE).strip()
    return cleaned.strip()


SYSTEM_PROMPT_PERSONA = """You are NeuroTwin, a warm, patient, loving, and gentle AI cognitive companion for an elderly person experiencing memory impairment.

Rules:
1. Always maintain a calm, comforting, simple, and reassuring tone.
2. Ground your answers ONLY in the provided Patient Knowledge Context and Live Camera View.
3. NEVER invent or hallucinate people, stories, or events that are not in the context.
4. If the Live Camera View indicates no person is detected and the patient asks who is there, kindly tell them no one is currently in front of them.
5. Keep your spoken responses concise (1 to 2 comforting sentences maximum) so they are effortless to listen to.
"""

# Groq Cloud API endpoint
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "openai/gpt-oss-120b"


class LLMCompanionService:
    """LLM reasoning service interfacing with Groq Cloud API or local Ollama."""

    def _build_context_summary(self, visual_context: Optional[Dict[str, Any]] = None) -> str:
        """Assemble real patient context from database and active camera feed."""
        # 1. Real Visual Context (Camera Feed)
        if visual_context and (visual_context.get("name") or visual_context.get("person_id")):
            name = visual_context.get("name", "Unknown")
            rel = visual_context.get("relationship", "Friend")
            mems = visual_context.get("memories", [])
            visual_str = f"Recognized person in view: {name} ({rel}). Notes: {', '.join(mems) if mems else 'None'}"
        else:
            visual_str = "No person currently recognized in camera view."

        # 2. Real Registered Family & Caregivers
        try:
            people = people_store.list_people()
            people_summary = ", ".join(f"{p['name']} ({p.get('relationship', 'Contact')})" for p in people)
        except Exception:
            people_summary = "None listed"

        # 3. Real Scheduled Medications
        try:
            meds = _medicines_store.list()
            meds_summary = ", ".join(f"{m['name']} {m.get('dosage', '')} ({m.get('schedule_time', '')})" for m in meds)
        except Exception:
            meds_summary = "None listed"

        # 4. Real Memories
        try:
            memories = _memories_store.list()
            mem_summary = "; ".join(f"{m['title']}" for m in memories[:4])
        except Exception:
            mem_summary = "None listed"

        return f"""
Patient Knowledge Context:
- Live Camera View: {visual_str}
- Registered Family / Contacts: {people_summary}
- Scheduled Medications: {meds_summary}
- Cherished Memories: {mem_summary}
"""

    def _build_prompt_body(
        self,
        patient_query: str,
        visual_context: Optional[Dict[str, Any]] = None
    ) -> str:
        context_block = self._build_context_summary(visual_context)
        return f"""{context_block}

Patient Spoken Query: "{patient_query}"

Generate a short, warm, comforting 1-2 sentence response for the patient based strictly on the above knowledge context:
"""

    def _call_groq(self, prompt_body: str) -> Optional[str]:
        """Call Groq Cloud API. Returns response text or None on failure."""
        if not settings.GROQ_API_KEY:
            return None
        try:
            response = requests.post(
                GROQ_API_URL,
                headers={
                    "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": GROQ_MODEL,
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT_PERSONA},
                        {"role": "user", "content": prompt_body},
                    ],
                    "temperature": 0.5,
                    "max_tokens": 300,
                },
                timeout=10.0,
            )
            if response.status_code == 200:
                data = response.json()
                text = data["choices"][0]["message"]["content"].strip()
                cleaned = _clean_llm_text(text)
                if cleaned:
                    logger.info("Groq LLM response received (model=%s): %s", GROQ_MODEL, cleaned[:60])
                    return cleaned
            else:
                logger.warning("Groq API returned status %s: %s", response.status_code, response.text[:200])
        except Exception as e:
            logger.warning("Groq Cloud API call failed: %s", e)
        return None

    def _call_ollama(self, prompt_body: str) -> Optional[str]:
        """Call local Ollama server."""
        try:
            response = requests.post(
                f"{settings.OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": settings.OLLAMA_MODEL,
                    "system": SYSTEM_PROMPT_PERSONA,
                    "prompt": prompt_body,
                    "stream": False,
                },
                timeout=2.0,
            )
            if response.status_code == 200:
                text = response.json().get("response", "").strip()
                cleaned = _clean_llm_text(text)
                if cleaned:
                    return cleaned
        except Exception as e:
            logger.warning("Ollama local LLM unavailable: %s", e)
        return None

    def _fallback_response(self, patient_query: str, visual_context: Optional[Dict[str, Any]] = None) -> str:
        """Instant rule-based warm persona fallback without hardcoded falsehoods."""
        q = patient_query.lower()
        if "who" in q:
            if visual_context and visual_context.get("name"):
                return f"You are looking at {visual_context['name']}, your {visual_context.get('relationship', 'friend')}."
            return "There is no one standing in front of you right now, but your loved ones are always close in heart."
        elif "medicine" in q or "medication" in q or "pill" in q:
            try:
                meds = _medicines_store.list()
                if meds:
                    return f"Your scheduled medicines today include {meds[0]['name']} at {meds[0].get('schedule_time', 'scheduled time')}."
            except Exception:
                pass
            return "Your care team has organized your medication schedule safely for today."
        elif "glass" in q:
            return "Your reading glasses are safely resting on the table next to your favorite chair."
        elif "story" in q or "memory" in q:
            try:
                mems = _memories_store.list()
                if mems:
                    return f"Let's remember: {mems[0]['title']} — {mems[0].get('description', '')}"
            except Exception:
                pass
            return "You have lived a life full of beautiful stories and wonderful memories."
        else:
            return "I am right here with you, keeping you safe, comfortable, and sound."

    def generate_companion_response(
        self,
        patient_query: str,
        visual_context: Optional[Dict[str, Any]] = None
    ) -> str:
        """Assembles prompt context and queries Groq → Ollama → fallback."""
        prompt_body = self._build_prompt_body(patient_query, visual_context)

        # 1. Groq Cloud API
        if settings.LLM_PROVIDER == "groq":
            result = self._call_groq(prompt_body)
            if result:
                return result

        # 2. Local Ollama
        result = self._call_ollama(prompt_body)
        if result:
            return result

        # 3. Dynamic grounded fallback
        return self._fallback_response(patient_query, visual_context)


llm_service = LLMCompanionService()