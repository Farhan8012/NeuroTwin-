import re
import requests
import json
import logging
from datetime import datetime, timezone
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
5. If the patient shares a memory, fact, or item location, confirm warmly that you have safely remembered it for them.
6. Keep your spoken responses concise (1 to 2 comforting sentences maximum) so they are effortless to listen to.
"""

# Groq Cloud API endpoint
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "openai/gpt-oss-120b"


class LLMCompanionService:
    """LLM reasoning service interfacing with Groq Cloud API or local Ollama.
    Equipped with real-time memory saving and retrieval directly backed by Supabase.
    """

    def _detect_and_save_memory(self, patient_query: str) -> Optional[Dict[str, Any]]:
        """Detect if the user is asking the agent to remember or store information.
        If so, extracts structured memory fields and saves directly into the Supabase-backed store.
        """
        q = patient_query.strip()
        q_lower = q.lower()

        # Keywords indicating a desire to remember/store
        triggers = [
            "remember that", "remember this", "remember:", "please remember",
            "don't forget that", "dont forget that", "note down that", "note that",
            "save this memory", "save memory", "keep in mind that", "store that",
            "i left my", "i put my", "i placed my", "my keys are", "my glasses are"
        ]

        is_remember_intent = any(trigger in q_lower for trigger in triggers)
        if not is_remember_intent and not q_lower.startswith("remember"):
            return None

        # Clean prompt for memory extraction via Groq (fast structured JSON)
        extract_prompt = f"""You are an intelligent memory extractor for an elderly assistant.
Analyze this statement: "{q}"

Return ONLY a valid JSON object (no markdown, no other text) with these keys:
- "title": A short 3-6 word title summarizing the memory or item location
- "description": The full clear description of what to remember
- "category": One of "item_location", "story", "reminder", "family", "health", "life_event"
- "person_binding": Name of any person involved or null
"""
        extracted = None
        if settings.GROQ_API_KEY:
            try:
                resp = requests.post(
                    GROQ_API_URL,
                    headers={
                        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": GROQ_MODEL,
                        "messages": [{"role": "user", "content": extract_prompt}],
                        "temperature": 0.1,
                        "max_tokens": 150,
                    },
                    timeout=5.0,
                )
                if resp.status_code == 200:
                    raw = resp.json()["choices"][0]["message"]["content"].strip()
                    raw = _clean_llm_text(raw)
                    # Extract JSON substring
                    match = re.search(r"\{[\s\S]*\}", raw)
                    if match:
                        extracted = json.loads(match.group(0))
            except Exception as e:
                logger.warning("LLM memory extraction failed: %s", e)

        # Fallback heuristic extraction if LLM call was unavailable
        if not extracted or not isinstance(extracted, dict) or not extracted.get("title"):
            clean_q = re.sub(r"^(please\s+)?(remember\s+(that|this|to)?|note\s+(down\s+)?that|don'?t\s+forget\s+that)\s*", "", q, flags=re.IGNORECASE).strip()
            title = clean_q[:50]
            extracted = {
                "title": title.capitalize(),
                "description": clean_q if clean_q else q,
                "category": "reminder" if "medicine" in q_lower or "appointment" in q_lower else ("item_location" if any(w in q_lower for w in ["keys", "glasses", "wallet", "drawer", "table"]) else "story"),
                "person_binding": None
            }

        # Save directly to JSON store (which immediately write-through mirrors to Supabase Postgres)
        new_memory = _memories_store.create({
            "title": extracted.get("title", "Saved Memory"),
            "description": extracted.get("description", q),
            "category": extracted.get("category", "story"),
            "person_binding": extracted.get("person_binding"),
            "event_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        })
        logger.info("Successfully persisted memory to Supabase: %s (id=%s)", new_memory.get("title"), new_memory.get("id"))
        return new_memory

    def _build_context_summary(self, visual_context: Optional[Dict[str, Any]] = None) -> str:
        """Assemble real patient context from database (Supabase backed) and active live camera stream."""
        # 1. Real Visual Context (Camera Feed)
        visual_parts = []
        if visual_context:
            person_info = visual_context.get("person") if isinstance(visual_context.get("person"), dict) else (
                visual_context if (visual_context.get("name") or visual_context.get("person_id")) else None
            )

            if person_info and person_info.get("name"):
                name = person_info.get("name", "Unknown")
                rel = person_info.get("relationship", "Friend")
                mems = person_info.get("memories", [])
                visual_parts.append(f"Person in front of camera: {name} ({rel}). Notes: {', '.join(mems) if mems else 'None'}")
            elif visual_context.get("face_detected"):
                visual_parts.append("Human face visible in camera feed (unrecognized visitor).")

            objects = visual_context.get("objects", [])
            if objects:
                obj_labels = [f"{o.get('label', o.get('class', 'item'))} ({int(o.get('confidence', 1.0) * 100)}% match)" for o in objects]
                visual_parts.append(f"Objects detected in camera view: {', '.join(obj_labels)}")

            if visual_context.get("camera_active") or visual_parts:
                visual_parts.append("Camera Status: Live & Connected.")

        if not visual_parts:
            visual_str = "Camera is active. No person or objects currently detected in front of the lens."
        else:
            visual_str = "\n".join(f"- {p}" for p in visual_parts)

        # 2. Real Registered Family & Caregivers
        try:
            people = people_store.list_people()
            people_summary = ", ".join(f"{p['name']} ({p.get('relationship', 'Contact')})" for p in people) if people else "None registered yet"
        except Exception:
            people_summary = "None listed"

        # 3. Real Scheduled Medications
        try:
            meds = _medicines_store.list()
            meds_summary = ", ".join(f"{m['name']} {m.get('dosage', '')} ({m.get('schedule_time', '')})" for m in meds) if meds else "None currently scheduled"
        except Exception:
            meds_summary = "None listed"

        # 4. Real Memories & Saved Notes (Supabase-backed)
        try:
            memories = _memories_store.list()
            if memories:
                mem_lines = [f"• {m.get('title')}: {m.get('description', '')} ({m.get('category', 'note')})" for m in memories[-10:]]
                mem_summary = "\n".join(mem_lines)
            else:
                mem_summary = "No saved memories or notes yet."
        except Exception:
            mem_summary = "None listed"

        return f"""
Patient Knowledge Context:
- Live Camera View: {visual_str}
- Registered Family / Contacts: {people_summary}
- Scheduled Medications: {meds_summary}
- Memories & Stored Notes:
{mem_summary}
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
                    "temperature": 0.4,
                    "max_tokens": 300,
                },
                timeout=10.0,
            )
            if response.status_code == 200:
                data = response.json()
                text = data["choices"][0]["message"]["content"].strip()
                cleaned = _clean_llm_text(text)
                if cleaned:
                    logger.info("Groq LLM response received: %s", cleaned[:60])
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

    def _fallback_response(self, patient_query: str, visual_context: Optional[Dict[str, Any]] = None, saved_memory: Optional[Dict[str, Any]] = None) -> str:
        """Instant rule-based warm persona fallback without hallucinations."""
        if saved_memory:
            return f"I have safely remembered that for you: {saved_memory.get('title')}."

        q = patient_query.lower()
        if "who" in q:
            if visual_context and visual_context.get("name"):
                return f"You are looking at {visual_context['name']}, your {visual_context.get('relationship', 'friend')}."
            return "There is no one standing in front of you right now, but your loved ones are always close in heart."
        elif "medicine" in q or "medication" in q or "pill" in q:
            try:
                meds = _medicines_store.list()
                if meds:
                    return f"Your scheduled medicines include {meds[0]['name']} at {meds[0].get('schedule_time', 'scheduled time')}."
            except Exception:
                pass
            return "You have no active medications scheduled at this moment."
        else:
            # Check if any saved memory matches
            try:
                memories = _memories_store.list()
                for m in reversed(memories):
                    words = [w for w in re.findall(r"\w+", m.get("title", "").lower()) if len(w) > 3]
                    if any(w in q for w in words):
                        return f"According to your notes: {m.get('description')}."
            except Exception:
                pass
            return "I am right here with you, keeping you safe and sound."

    def generate_companion_response(
        self,
        patient_query: str,
        visual_context: Optional[Dict[str, Any]] = None
    ) -> str:
        """Processes patient query, detects & persists any memories to Supabase, and answers."""
        # 1. Detect if the user wants to remember something and save to Supabase
        saved_memory = self._detect_and_save_memory(patient_query)

        # 2. Build prompt body with live context + updated Supabase memories
        prompt_body = self._build_prompt_body(patient_query, visual_context)

        # If we just saved a memory, instruct the LLM to give a warm confirmation
        if saved_memory:
            prompt_body += f"\nNote: The memory '{saved_memory.get('title')}' has just been successfully saved in the database. Give a warm, gentle confirmation to the patient."

        # 3. Query Groq Cloud API
        if settings.LLM_PROVIDER == "groq":
            result = self._call_groq(prompt_body)
            if result:
                return result

        # 4. Local Ollama Fallback
        result = self._call_ollama(prompt_body)
        if result:
            return result

        # 5. Rule-based grounded fallback
        return self._fallback_response(patient_query, visual_context, saved_memory)


llm_service = LLMCompanionService()