import re
import requests
import json
import logging
from typing import Dict, Any, Optional
from app.config import settings

def _clean_llm_text(text: str) -> str:
    if not text:
        return ""
    # Remove any <think>...</think> blocks
    cleaned = re.sub(r"<think>[\s\S]*?</think>", "", text, flags=re.IGNORECASE).strip()
    # If unclosed <think> remains due to max_tokens
    if "<think>" in cleaned.lower():
        parts = re.split(r"<think>", cleaned, flags=re.IGNORECASE)
        cleaned = parts[0].strip() if parts[0].strip() else ""
    return cleaned or text.strip()

logger = logging.getLogger(__name__)

SYSTEM_PROMPT_PERSONA = """You are NeuroTwin, a warm, patient, and gentle AI cognitive companion for an elderly person experiencing memory impairment.

Rules:
1. Always maintain a calm, comforting, simple, and story-shaped tone.
2. Never sound like a cold database lookup or robot (e.g. NEVER say "Subject identified: ID #402").
3. Always reassure the patient using their personal context, family relationships, recent visits, and shared history.
4. Keep answers short (1 to 3 sentences maximum) so they are easy to listen to.
"""

# Groq Cloud API endpoint
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "qwen/qwen3.6-27b"


class LLMCompanionService:
    """LLM reasoning service interfacing with Ollama (Qwen3-8B) or Groq Cloud API.

    Provider priority:
      1. If LLM_PROVIDER=groq and GROQ_API_KEY is set → Groq Cloud (ultra-fast, ~0.5s)
      2. If LLM_PROVIDER=ollama or Groq fails  → local Ollama (private, ~15-25s)
      3. If both fail → rule-based warm fallback persona (instant, offline)
    """

    def _build_prompt_body(
        self,
        patient_query: str,
        visual_context: Optional[Dict[str, Any]] = None
    ) -> str:
        """Assemble the user prompt from visual context and patient query."""
        person_name = visual_context.get("name", "Sarah Varma") if visual_context else "Sarah Varma"
        relationship = visual_context.get("relationship", "Daughter") if visual_context else "Daughter"
        recent_visit = visual_context.get("recent_visit", "Yesterday at 3:30 PM") if visual_context else "Yesterday"
        memories = visual_context.get("memories", ["Brought blueberry muffins yesterday"]) if visual_context else ["Brought blueberry muffins yesterday"]

        return f"""
Visual Context:
- Active Person: {person_name} ({relationship})
- Last Visit: {recent_visit}
- Key Memory Notes: {', '.join(memories)}

Patient Spoken Query: "{patient_query}"

Generate a short, warm, comforting 2-sentence response for the patient:
"""

    # ------------------------------------------------------------------
    # Groq Cloud API (OpenAI-compatible chat completions)
    # ------------------------------------------------------------------

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
                    "temperature": 0.6,
                    "max_tokens": 1200,
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

    # ------------------------------------------------------------------
    # Local Ollama (Qwen3-8B)
    # ------------------------------------------------------------------

    def _call_ollama(self, prompt_body: str) -> Optional[str]:
        """Call local Ollama server. Returns response text or None on failure."""
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
                    logger.info("Ollama LLM response received (model=%s)", settings.OLLAMA_MODEL)
                    return cleaned
        except Exception as e:
            logger.warning("Ollama local LLM unavailable: %s", e)
        return None

    # ------------------------------------------------------------------
    # Rule-based warm fallback
    # ------------------------------------------------------------------

    def _fallback_response(self, patient_query: str, person_name: str) -> str:
        """Instant rule-based warm persona fallback (no LLM needed)."""
        query_lower = patient_query.lower()
        if "who" in query_lower:
            return f"This is your daughter {person_name}. She visited you yesterday afternoon and brought your favorite blueberry muffins."
        elif "glasses" in query_lower:
            return "Your blue reading glasses were last seen on the living room coffee table next to your book."
        elif "keys" in query_lower:
            return "Your keys are safely placed on the hook near the front door."
        else:
            return f"I am right here with you. Your daughter {person_name} is here and everything is safe and sound."

    # ------------------------------------------------------------------
    # Main entry point
    # ------------------------------------------------------------------

    def generate_companion_response(
        self,
        patient_query: str,
        visual_context: Optional[Dict[str, Any]] = None
    ) -> str:
        """Assembles prompt context and queries Groq → Ollama → fallback."""

        prompt_body = self._build_prompt_body(patient_query, visual_context)
        person_name = visual_context.get("name", "Sarah Varma") if visual_context else "Sarah Varma"

        # 1. Groq Cloud API (if configured as primary)
        if settings.LLM_PROVIDER == "groq":
            result = self._call_groq(prompt_body)
            if result:
                return result
            # Groq failed — try Ollama as automatic fallback
            logger.info("Groq unavailable, falling back to Ollama")

        # 2. Local Ollama
        result = self._call_ollama(prompt_body)
        if result:
            return result

        # 3. Rule-based warm fallback persona (always available, offline)
        logger.info("All LLM providers unavailable, using rule-based fallback")
        return self._fallback_response(patient_query, person_name)


llm_service = LLMCompanionService()