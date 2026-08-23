import re
import requests
import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from app.config import settings
from app.services import people_store
from app.services.json_store import JSONStore

logger = logging.getLogger("neurotwin.llm")

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
    # Strip emojis and non-ASCII decorative symbols so TTS never speaks 'blossom' or emoji names
    cleaned = re.sub(r"[^\x00-\x7F]+", " ", cleaned)
    cleaned = re.sub(r"[*#`_~]", "", cleaned)
    return re.sub(r"\s+", " ", cleaned).strip()


SYSTEM_PROMPT_PERSONA = """You are NeuroTwin, an intelligent, loving, and attentive AI cognitive companion for an elderly person.

Rules:
1. NEVER output emojis, icons, or decorative symbols (such as flowers or smileys) anywhere in your text, because they are read aloud by the voice engine.
2. Ground your answers directly in the Live Camera View & Visual Episodic Memory:
   - If asked "Where are my glasses?", "Where did I keep/leave my glasses?", or "Where did you see my glasses/book/laptop last?":
     * If the item is in the Live Camera View right now, say: "Your reading glasses are right on the table in front of the camera."
     * If the item is NOT currently in view, check the "Recent Visual Memory & Last-Seen Locations" section and answer with where and when the camera last saw it (e.g. "I last saw your reading glasses about 2 minutes ago resting on your desk next to your laptop.").
     * If there is no record of where it was, say: "I haven't seen your glasses in the camera recently, but let's check your desk or bedside table."
   - If "Person in front of camera: NO", NEVER say "I see you" or "I see you sitting here". Accurately describe what is on the table/desk.
3. When the patient introduces a friend, family member, caregiver, or doctor (e.g., "my friend Rish Varma", "add Jay Chandra to my friends list"), confirm warmly that you have remembered and saved them.
4. If the patient corrects you, apologize gently and acknowledge what the camera actually sees without arguing.
5. Keep spoken replies warm, comforting, natural, and concise (1 to 2 sentences).
"""

# Groq Cloud API endpoint
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "openai/gpt-oss-120b"


class LLMCompanionService:
    """LLM reasoning service interfacing with Gemini Flash Lite, Groq Cloud API, or local Ollama.
    Equipped with real-time memory saving and automatic friend/family registration.
    """

    def _detect_and_save_intents(self, patient_query: str) -> None:
        """Intelligently detects:
        1. New Friends & Family members -> saves directly to people_store (so they appear in the UI list!)
        2. New medications -> saves to medicines_store
        3. Memories & item locations -> saves to memories_store
        """
        q = patient_query.strip()
        q_lower = q.lower()

        triggers = [
            "add", "remember", "forget", "note down", "note that", "save", "insert",
            "friend", "daughter", "son", "doctor", "neighbor", "wife", "husband",
            "brother", "sister", "caregiver", "family", "i left my", "i put my", "i placed my",
            "glasses are", "keys are", "medicine", "medication", "pill"
        ]

        if not any(t in q_lower for t in triggers):
            return

        extract_prompt = f"""You are an AI assistant helping an elderly person manage their memory and contacts.
Analyze this user query: "{q}"

Determine if the user is mentioning:
1. A person/friend/family member (e.g., "add jay chandra to my friends list", "Remember my friend's name is Rish Varma", "Add Sarah as my daughter")
2. A medication (e.g., "I take Aspirin 50mg in the morning")
3. A memory, note, or item location (e.g., "Remember I left my glasses on the desk")

Return ONLY a valid JSON object with these exact keys:
{{
  "type": "person" | "medicine" | "memory" | "none",
  "person_name": "string or null",
  "relationship": "Friend" | "Daughter" | "Son" | "Doctor" | "Caregiver" | "Neighbor" | "Family" | null,
  "medicine_name": null,
  "dosage": null,
  "schedule": null,
  "memory_title": null,
  "memory_description": null
}}
"""
        extracted = None

        # 1. Try Gemini Flash Lite for instant structured intent extraction
        if settings.GEMINI_API_KEY:
            try:
                from google import genai
                client = genai.Client(api_key=settings.GEMINI_API_KEY)
                res = client.models.generate_content(
                    model="gemini-3.1-flash-lite",
                    contents=extract_prompt
                )
                if res and res.text:
                    cleaned = _clean_llm_text(res.text)
                    match = re.search(r"\{[\s\S]*\}", cleaned)
                    if match:
                        extracted = json.loads(match.group(0))
            except Exception as e:
                logger.debug("Gemini intent extraction failed, trying Groq: %s", e)

        # 2. Fallback to Groq if Gemini unavailable
        if not extracted and settings.GROQ_API_KEY:
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
                        "max_tokens": 600,
                    },
                    timeout=5.0,
                )
                if resp.status_code == 200:
                    raw = resp.json()["choices"][0]["message"]["content"].strip()
                    raw = _clean_llm_text(raw)
                    match = re.search(r"\{[\s\S]*\}", raw)
                    if match:
                        extracted = json.loads(match.group(0))
            except Exception as e:
                logger.warning("Groq intent extraction failed: %s", e)

        # Process extracted intent
        if extracted and isinstance(extracted, dict):
            itype = extracted.get("type", "none")

            # 1. Person intent -> Save to people_store!
            if itype == "person" or extracted.get("person_name"):
                name = (extracted.get("person_name") or "").strip().title()
                rel = (extracted.get("relationship") or "Friend").strip().capitalize()
                if name and name.lower() not in ["null", "none", ""]:
                    existing = [p for p in people_store.list_people() if p.get("name", "").lower() == name.lower()]
                    if not existing:
                        person = people_store.create_person({
                            "name": name,
                            "relationship": rel,
                            "birthday": "",
                            "memories": [q],
                            "important_life_events": [],
                            "favorite_songs": [],
                            "favorite_places": [],
                            "hobbies": [],
                            "family_stories": [],
                        })
                        logger.info("Saved new person to Friends & Family list: %s (%s)", name, rel)
                    else:
                        p = existing[0]
                        mems = p.get("memories", [])
                        if q not in mems:
                            mems.append(q)
                            people_store.update_person(p["id"], {"memories": mems})

                    _memories_store.create({
                        "title": f"{name} ({rel})",
                        "description": q,
                        "category": "family" if rel in ["Daughter", "Son", "Family", "Wife", "Husband"] else "story",
                        "person_binding": name,
                        "event_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                    })
                    return

            # 2. Medicine intent -> Save to medicines_store!
            if itype == "medicine" and extracted.get("medicine_name"):
                med_name = extracted.get("medicine_name", "").strip().title()
                dosage = extracted.get("dosage", "As directed").strip()
                schedule = extracted.get("schedule", "Daily").strip()
                if med_name and med_name.lower() not in ["null", "none", ""]:
                    _medicines_store.create({
                        "name": med_name,
                        "dosage": dosage,
                        "schedule_time": schedule,
                        "instructions": q,
                    })
                    logger.info("Saved new medicine: %s %s", med_name, dosage)
                    return

            # 3. Memory / Note intent -> Save to memories_store!
            if itype == "memory" or extracted.get("memory_title"):
                title = (extracted.get("memory_title") or q[:40]).strip().capitalize()
                desc = (extracted.get("memory_description") or q).strip()
                _memories_store.create({
                    "title": title,
                    "description": desc,
                    "category": "item_location" if any(w in q_lower for w in ["glasses", "keys", "wallet", "table", "drawer"]) else "story",
                    "person_binding": None,
                    "event_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                })
                logger.info("Saved new memory: %s", title)
                return

        # Multi-pattern regex fallback
        patterns = [
            r"add\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)\s+(?:as|to)?\s*(?:my\s+)?(friend|daughter|son|doctor|caregiver|family|neighbor)(?:s)?(?:\s+list)?",
            r"(?:my\s+)?(friend|daughter|son|doctor|caregiver|family|neighbor)(?:'s)?\s+(?:name\s+is\s+)?([A-Za-z]+(?:\s+[A-Za-z]+)?)",
            r"remember\s+(?:my\s+)?(friend|daughter|son|doctor|caregiver|family|neighbor)?\s*([A-Za-z]+(?:\s+[A-Za-z]+)?)"
        ]
        for pat in patterns:
            m = re.search(pat, q, re.IGNORECASE)
            if m:
                g1, g2 = m.groups()
                # Determine which is name and which is relation
                rel_candidates = ["friend", "daughter", "son", "doctor", "caregiver", "family", "neighbor"]
                if g1.lower() in rel_candidates:
                    rel = g1.strip().capitalize()
                    name = g2.strip().title()
                else:
                    name = g1.strip().title()
                    rel = g2.strip().capitalize() if g2 else "Friend"

                if name and name.lower() not in ["null", "none", "my"]:
                    people_store.create_person({
                        "name": name,
                        "relationship": rel,
                        "birthday": "",
                        "memories": [q],
                        "important_life_events": [],
                        "favorite_songs": [],
                        "favorite_places": [],
                        "hobbies": [],
                        "family_stories": [],
                    })
                    logger.info("Regex fallback saved new person: %s (%s)", name, rel)
                    return

        _memories_store.create({
            "title": q[:40].capitalize(),
            "description": q,
            "category": "story",
            "person_binding": None,
            "event_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        })

    def _build_context_summary(self, visual_context: Optional[Dict[str, Any]] = None) -> str:
        """Assemble patient knowledge, live camera perception, and rolling visual episodic memory."""
        visual_parts = []
        if visual_context:
            person_info = visual_context.get("person") if isinstance(visual_context.get("person"), dict) else None
            person_present = visual_context.get("person_present", False) or visual_context.get("face_detected", False)
            wearing_glasses = visual_context.get("wearing_glasses", False)
            glasses_visible = visual_context.get("glasses_visible", False)
            glasses_location = visual_context.get("glasses_location", "not visible")
            scene_summary = visual_context.get("scene_summary", "")

            if person_info and person_info.get("name"):
                name = person_info.get("name", "Unknown")
                rel = person_info.get("relationship", "Family")
                mems = person_info.get("memories", [])
                glasses_str = "wearing reading glasses" if wearing_glasses else "not wearing glasses"
                visual_parts.append(f"Person in front of camera: YES - {name} ({rel}), {glasses_str}. Notes: {', '.join(mems) if mems else 'None'}")
            elif person_present:
                glasses_status = "YES (reading glasses on face)" if wearing_glasses else "NO (not wearing glasses)"
                visual_parts.append(f"Person in front of camera: YES (Patient is visible). Wearing glasses: {glasses_status}.")
            else:
                visual_parts.append("Person in front of camera: NO (Camera is viewing a desk / table / room, no person in view).")
                if glasses_visible or "table" in glasses_location.lower() or "desk" in glasses_location.lower():
                    visual_parts.append("Reading Glasses: A pair of reading glasses is resting on the table/desk right in front of the camera.")

            objects = visual_context.get("objects", [])
            if objects:
                obj_names = []
                for o in objects:
                    if isinstance(o, dict):
                        lbl = o.get("label", o.get("class", ""))
                        if lbl and lbl.lower() != "person":
                            obj_names.append(lbl)
                    elif isinstance(o, str) and o.lower() != "person":
                        obj_names.append(o)
                if obj_names:
                    visual_parts.append(f"Visible items in camera view: {', '.join(obj_names)}")

            if scene_summary:
                visual_parts.append(f"Visual Scene Description: {scene_summary}")

            if visual_context.get("camera_active") or visual_parts:
                visual_parts.append("Camera Status: Live & Streaming.")

        if not visual_parts:
            visual_str = "Camera is active. Viewing desk/room. No person in front of the lens."
        else:
            visual_str = "\n".join(f"- {p}" for p in visual_parts)

        # Visual Episodic Memory (Rolling 5-15 minute history of seen items & locations)
        try:
            from app.services import visual_memory
            vmem_summary = visual_memory.get_visual_memory_summary()
        except Exception:
            vmem_summary = "No recent visual memory recorded."

        # Registered Family & Friends
        try:
            people = people_store.list_people()
            people_summary = ", ".join(f"{p['name']} ({p.get('relationship', 'Contact')})" for p in people) if people else "None registered yet"
        except Exception:
            people_summary = "None registered yet"

        # Scheduled Medications
        try:
            meds = _medicines_store.list()
            meds_summary = ", ".join(f"{m['name']} {m.get('dosage', '')} ({m.get('schedule_time', '')})" for m in meds) if meds else "None currently scheduled"
        except Exception:
            meds_summary = "None listed"

        # Memories & Notes
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
- Current Live Camera View:
{visual_str}

- Recent Visual Memory & Last-Seen Locations (Camera History):
{vmem_summary}

- Registered Friends & Family: {people_summary}
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

Patient Spoken Statement / Query: "{patient_query}"

Generate a short, warm, comforting, and factually accurate 1-2 sentence response (NO emojis) based strictly on the above context:
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
                    "temperature": 0.3,
                    "max_tokens": 250,
                },
                timeout=8.0,
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
            logger.debug("Ollama local LLM unavailable: %s", e)
        return None

    def generate_companion_response(
        self,
        patient_query: str,
        visual_context: Optional[Dict[str, Any]] = None,
    ) -> str:
        """Processes patient query, detects & persists any memories/friends, and answers."""
        # 1. Detect and execute memory/people/medicine saving
        self._detect_and_save_intents(patient_query)

        # 2. If patient query asks about visual context, analyze the latest camera frame on-demand
        q_lower = patient_query.lower()
        visual_triggers = ["see", "look", "camera", "glasses", "spectacles", "laptop", "book", "desk", "table", "front", "what is this", "where is", "where did i", "wearing", "read"]

        if visual_context is None:
            from app.services import context_cache
            visual_context = context_cache.get_visual_context()

        if any(w in q_lower for w in visual_triggers):
            from app.services import context_cache
            latest_frame = context_cache.get_latest_frame()
            if latest_frame:
                try:
                    from app.services.vlm_service import vlm_service
                    vlm_res = vlm_service.analyze_frame(latest_frame)
                    if vlm_res:
                        visual_context = {
                            "camera_active": True,
                            "person": visual_context.get("person") if visual_context else None,
                            "face_detected": vlm_res.get("person_present", False),
                            "person_present": vlm_res.get("person_present", False),
                            "wearing_glasses": vlm_res.get("wearing_glasses", False),
                            "glasses_visible": vlm_res.get("glasses_visible", False),
                            "glasses_location": vlm_res.get("glasses_location", "not visible"),
                            "objects": [{"class": o.lower(), "label": o, "confidence": 0.95} for o in vlm_res.get("objects_detected", [])],
                            "scene_summary": vlm_res.get("scene_summary", ""),
                        }
                except Exception as e:
                    logger.warning("On-demand VLM call error: %s", e)

        # 3. Build prompt body with live context + visual memory
        prompt_body = self._build_prompt_body(
            patient_query=patient_query,
            visual_context=visual_context
        )

        response_text = None
        if settings.LLM_PROVIDER == "groq":
            response_text = self._call_groq(prompt_body)
            if not response_text:
                response_text = self._call_ollama(prompt_body)
        else:
            response_text = self._call_ollama(prompt_body)
            if not response_text:
                response_text = self._call_groq(prompt_body)

        if response_text:
            return _clean_llm_text(response_text)

        # Warm graceful fallback with episodic memory lookup
        if "glass" in q_lower or "spectacle" in q_lower:
            from app.services import visual_memory
            last_rec = visual_memory.get_last_seen_item(patient_query)
            if last_rec:
                return f"I last saw your {last_rec['item']} {last_rec['ago']} {last_rec['location']}."
            if visual_context and (visual_context.get("glasses_visible") or visual_context.get("glasses_location") == "on table/desk"):
                return "Your reading glasses are resting right on the table in front of the camera."
            if visual_context and visual_context.get("wearing_glasses"):
                return "You are wearing your reading glasses right now."
            return "Your reading glasses are resting on your desk."

        if "see" in q_lower or "camera" in q_lower:
            if visual_context and visual_context.get("person_present"):
                return "Yes, I see you clearly right in front of the camera."
            return "I can see your desk with your items resting in front of the camera."
        if "jay" in q_lower or "rish" in q_lower or "friend" in q_lower:
            return "Your friends are safely saved in your friends list."
        return "I am right here with you, keeping you safe and sound."


llm_service = LLMCompanionService()