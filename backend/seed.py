"""Seed the NeuroTwin database with sample data.

Usage:
    cd backend
    .venv/bin/python seed.py

Populates:
    - 3 sample people with face vectors in Qdrant
    - 5 memory anchors
    - 4 medications
    - 3 emergency contacts

Safe to run multiple times — skips if data already exists.
"""

import json
import sys
import os
import uuid
import numpy as np
from pathlib import Path

# Ensure we can import from app/
sys.path.insert(0, str(Path(__file__).parent))

from app.config import settings
from app.services.qdrant_service import qdrant_service
from app.services import people_store
from app.services.json_store import JSONStore

# ── Sample Data ──────────────────────────────────────────────────────

PEOPLE = [
    {
        "name": "Sarah Varma",
        "relationship": "Daughter",
        "birthday": "1992-04-14",
        "memories": [
            "Brought blueberry muffins during her visit yesterday.",
            "Loves taking walks in the botanical garden with you.",
        ],
        "important_life_events": [
            "Graduated from law school in 2016.",
            "Married Mark in 2020.",
        ],
        "favorite_songs": ["You Are My Sunshine", "Here Comes the Sun"],
        "favorite_places": ["San Francisco Botanical Garden", "Lake Tahoe Cabin"],
        "hobbies": ["Gardening", "Baking pastries", "Oil painting"],
        "family_stories": [
            "Remember when Sarah caught her first fish at the lake when she was 8 years old.",
        ],
    },
    {
        "name": "Dr. Aris Thorne",
        "relationship": "Neurologist",
        "birthday": "1980-09-22",
        "memories": [
            "Weekly checkup every Tuesday morning.",
            "Always asks about your appetite and sleep.",
        ],
        "important_life_events": [],
        "favorite_songs": [],
        "favorite_places": [],
        "hobbies": [],
        "family_stories": [],
    },
    {
        "name": "Robert Lowe",
        "relationship": "Neighbor",
        "birthday": "1964-03-17",
        "memories": [
            "Helps with groceries every Saturday.",
            "Has a golden retriever named Max.",
        ],
        "important_life_events": [],
        "favorite_songs": [],
        "favorite_places": [],
        "hobbies": ["Fishing", "Woodworking"],
        "family_stories": [],
    },
]

MEMORIES = [
    {
        "title": "Graduated law school in 2016",
        "description": "Attended commencement ceremony in San Francisco. Sarah wore a blue cap and gown.",
        "category": "life_event",
        "person_binding": "Sarah Varma",
    },
    {
        "title": "Caught first fish at Lake Tahoe",
        "description": "Summer vacation when she was 8 years old. It was a small trout.",
        "category": "anecdote",
        "person_binding": "Sarah Varma",
    },
    {
        "title": "You Are My Sunshine",
        "description": "Sarah's favorite song. Used as soothing audio anchor during moments of hesitation.",
        "category": "song",
        "person_binding": "Sarah Varma",
    },
    {
        "title": "Tuesday morning checkups",
        "description": "Dr. Thorne visits every Tuesday at 9 AM for cognitive assessment.",
        "category": "story",
        "person_binding": "Dr. Aris Thorne",
    },
    {
        "title": "Saturday grocery runs",
        "description": "Robert helps carry groceries from the car every Saturday afternoon.",
        "category": "story",
        "person_binding": "Robert Lowe",
    },
]

MEDICINES = [
    {
        "name": "Donepezil",
        "dosage": "10 mg",
        "schedule_time": "08:00 AM Daily",
        "instructions": "Take with breakfast water. Report any nausea.",
    },
    {
        "name": "Memantine",
        "dosage": "10 mg",
        "schedule_time": "08:00 PM Daily",
        "instructions": "Take after evening meal.",
    },
    {
        "name": "Vitamin D3",
        "dosage": "2000 IU",
        "schedule_time": "12:00 PM Daily",
        "instructions": "Take with lunch.",
    },
    {
        "name": "Melatonin",
        "dosage": "3 mg",
        "schedule_time": "09:00 PM Daily",
        "instructions": "Take 30 minutes before bedtime. For sleep support.",
    },
]

EMERGENCY_CONTACTS = [
    {
        "name": "Sarah Varma",
        "relationship": "Daughter",
        "phone": "+1 (555) 234-5678",
        "is_primary": True,
    },
    {
        "name": "Dr. Aris Thorne",
        "relationship": "Neurologist",
        "phone": "+1 (555) 987-6543",
        "is_primary": False,
    },
    {
        "name": "Robert Lowe",
        "relationship": "Neighbor",
        "phone": "+1 (555) 456-7890",
        "is_primary": False,
    },
]


# ── Seed Functions ───────────────────────────────────────────────────

def seed_people():
    """Register people and index face vectors into Qdrant."""
    existing = people_store.list_people()
    existing_names = {p["name"] for p in existing}

    count = 0
    for person_data in PEOPLE:
        if person_data["name"] in existing_names:
            print(f"  ⊘ {person_data['name']} — already registered, skipping")
            continue

        # Create profile in JSON registry
        person = people_store.create_person(person_data)
        print(f"  ✔ Registered {person['name']} ({person['relationship']}) — {person['id']}")

        # Generate a deterministic face vector (same person = same vector)
        seed = hash(person_data["name"]) % 10000
        rng = np.random.RandomState(seed)
        vec = rng.randn(512).astype(np.float32)
        vec = (vec / np.linalg.norm(vec)).tolist()

        # Index into Qdrant
        ok = qdrant_service.upsert_person_embedding(
            person["id"], vec,
            {k: v for k, v in person.items() if k not in ("vector_status",)},
        )
        if ok:
            people_store.update_person(person["id"], {"vector_status": "indexed"})
            print(f"    → Indexed 512-d face vector into Qdrant")
        else:
            print(f"    → Qdrant indexing failed (Qdrant may not be running)")

        count += 1

    return count


def seed_memories():
    """Populate memory anchors."""
    store = JSONStore("memories.json")
    existing = store.list()
    existing_titles = {m["title"] for m in existing}

    count = 0
    for mem in MEMORIES:
        if mem["title"] in existing_titles:
            print(f"  ⊘ \"{mem['title']}\" — already exists, skipping")
            continue
        store.create(mem)
        print(f"  ✔ Memory: \"{mem['title']}\" ({mem['category']})")
        count += 1

    return count


def seed_medicines():
    """Populate medication schedule."""
    store = JSONStore("medicines.json")
    existing = store.list()
    existing_names = {m["name"] for m in existing}

    count = 0
    for med in MEDICINES:
        if med["name"] in existing_names:
            print(f"  ⊘ {med['name']} — already exists, skipping")
            continue
        store.create(med)
        print(f"  ✔ Medicine: {med['name']} {med['dosage']} — {med['schedule_time']}")
        count += 1

    return count


def seed_emergency_contacts():
    """Populate emergency contacts."""
    store = JSONStore("emergency_contacts.json")
    existing = store.list()
    existing_names = {c["name"] for c in existing}

    count = 0
    for contact in EMERGENCY_CONTACTS:
        if contact["name"] in existing_names:
            print(f"  ⊘ {contact['name']} — already exists, skipping")
            continue
        store.create(contact)
        primary = "★ PRIMARY" if contact["is_primary"] else ""
        print(f"  ✔ Contact: {contact['name']} ({contact['relationship']}) {primary}")
        count += 1

    return count


# ── Main ─────────────────────────────────────────────────────────────

def main():
    print("=" * 50)
    print("  NeuroTwin Database Seed Script")
    print("=" * 50)

    print("\n[1/4] People & Face Vectors")
    people_count = seed_people()

    print("\n[2/4] Memory Anchors")
    memory_count = seed_memories()

    print("\n[3/4] Medications")
    medicine_count = seed_medicines()

    print("\n[4/4] Emergency Contacts")
    contact_count = seed_emergency_contacts()

    total = people_count + memory_count + medicine_count + contact_count
    print(f"\n{'=' * 50}")
    print(f"  Seeded {total} new records:")
    print(f"    People:    {people_count}")
    print(f"    Memories:  {memory_count}")
    print(f"    Medicines: {medicine_count}")
    print(f"    Contacts:  {contact_count}")
    print(f"{'=' * 50}")

    if total == 0:
        print("\n  All data already present — nothing to do.")


if __name__ == "__main__":
    main()
