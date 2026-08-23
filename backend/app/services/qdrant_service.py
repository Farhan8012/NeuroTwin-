"""Qdrant Vector Database service — people & objects collections.

Point IDs in Qdrant must be UUIDs or unsigned integers. We convert the
human-readable string IDs (e.g. ``p_003``) from the people_store registry
into deterministic UUIDs using uuid5 so they round-trip cleanly.
"""

import logging
import uuid
from typing import List, Dict, Any, Optional
from qdrant_client import QdrantClient
from qdrant_client.http import models
from app.config import settings

logger = logging.getLogger(__name__)

# Deterministic namespace so "p_003" always maps to the same UUID
_NS = uuid.UUID("1b6a4e8c-2f3d-4a5e-9c7b-0d1e2f3a4b5c")


def _to_uuid(point_id: str) -> uuid.UUID:
    """Convert a string ID to a deterministic UUID5."""
    return uuid.uuid5(_NS, str(point_id))


def _from_uuid(vid: Any) -> str:
    """Extract original string ID from a stored UUID5 (best-effort lookup)."""
    return str(vid)


class QdrantService:
    def __init__(self):
        self.is_connected = False
        
        # 1. Attempt Qdrant Cloud if URL is provided
        if settings.QDRANT_URL:
            try:
                self.client = QdrantClient(
                    url=settings.QDRANT_URL,
                    api_key=settings.QDRANT_API_KEY if settings.QDRANT_API_KEY else None,
                    timeout=2.0
                )
                self._init_collections(strict=True)
                self.is_connected = True
                logger.info("Connected to Qdrant Cloud at %s", settings.QDRANT_URL)
                return
            except Exception as e:
                logger.warning("Qdrant Cloud connection failed: %s. Falling back to local/in-memory Qdrant.", e)

        # 2. Attempt local Qdrant service
        try:
            self.client = QdrantClient(host=settings.QDRANT_HOST, port=settings.QDRANT_PORT, timeout=1.0)
            self._init_collections(strict=True)
            self.is_connected = True
            logger.info("Connected to local Qdrant at %s:%d", settings.QDRANT_HOST, settings.QDRANT_PORT)
        except Exception as e:
            logger.warning("Local Qdrant DB connection failed, using in-memory mode: %s", e)
            self.client = QdrantClient(":memory:")
            self._init_collections(strict=False)
            self.is_connected = False

    # ------------------------------------------------------------------
    # Collection initialisation
    # ------------------------------------------------------------------

    def _init_collections(self, strict: bool = False):
        """Create *people* (512-d face vectors) and *objects* collections if absent."""
        try:
            collections = [c.name for c in self.client.get_collections().collections]

            if settings.QDRANT_COLLECTION_PEOPLE not in collections:
                self.client.create_collection(
                    collection_name=settings.QDRANT_COLLECTION_PEOPLE,
                    vectors_config=models.VectorParams(size=512, distance=models.Distance.COSINE),
                )
                logger.info("Created Qdrant collection: %s", settings.QDRANT_COLLECTION_PEOPLE)

            if settings.QDRANT_COLLECTION_OBJECTS not in collections:
                self.client.create_collection(
                    collection_name=settings.QDRANT_COLLECTION_OBJECTS,
                    vectors_config=models.VectorParams(size=128, distance=models.Distance.COSINE),
                )
                logger.info("Created Qdrant collection: %s", settings.QDRANT_COLLECTION_OBJECTS)
        except Exception as e:
            logger.error("Failed initialising Qdrant collections: %s", e)
            if strict:
                raise e

    # ------------------------------------------------------------------
    # People collection
    # ------------------------------------------------------------------

    def search_face(self, face_vector: List[float], limit: int = 1) -> Optional[Dict[str, Any]]:
        """Cosine-similarity search in the people collection."""
        try:
            result = self.client.query_points(
                collection_name=settings.QDRANT_COLLECTION_PEOPLE,
                query=face_vector,
                limit=limit,
                score_threshold=settings.FACE_MATCH_THRESHOLD,
            )
            if result.points:
                match = result.points[0]
                return {
                    "person_id": _from_uuid(match.id),
                    "score": match.score,
                    "payload": match.payload,
                }
        except Exception as e:
            logger.error("Qdrant face search failed: %s", e)
        return None

    def upsert_person(self, point_id: str, face_vector: List[float], payload: Dict[str, Any]) -> bool:
        try:
            self.client.upsert(
                collection_name=settings.QDRANT_COLLECTION_PEOPLE,
                points=[
                    models.PointStruct(
                        id=str(_to_uuid(point_id)),
                        vector=face_vector,
                        payload=payload,
                    )
                ],
            )
            return True
        except Exception as e:
            logger.error("Qdrant upsert failed: %s", e)
            return False

    def upsert_person_embedding(self, person_id: str, face_vector: List[float], payload: Dict[str, Any]) -> bool:
        return self.upsert_person(person_id, face_vector, payload)

    def list_people_points(self) -> List[Dict[str, Any]]:
        try:
            result = []
            scroll_result = self.client.scroll(
                collection_name=settings.QDRANT_COLLECTION_PEOPLE,
                limit=1000,
                with_payload=True,
                with_vectors=False,
            )
            for point in scroll_result[0]:
                result.append({"person_id": _from_uuid(point.id), **(point.payload or {})})
            return result
        except Exception as e:
            logger.error("Qdrant scroll failed: %s", e)
            return []

    def delete_person_vectors(self, person_id: str) -> bool:
        try:
            self.client.delete(
                collection_name=settings.QDRANT_COLLECTION_PEOPLE,
                points_selector=models.PointIdsList(
                    points=[str(_to_uuid(person_id))]
                ),
            )
            return True
        except Exception as e:
            logger.error("Qdrant delete failed: %s", e)
            return False

    def collection_stats(self) -> Dict[str, Any]:
        stats = {}
        for name in [settings.QDRANT_COLLECTION_PEOPLE, settings.QDRANT_COLLECTION_OBJECTS]:
            try:
                info = self.client.get_collection(name)
                stats[name] = info.points_count or 0
            except Exception:
                stats[name] = 0
        return {
            "people": stats.get(settings.QDRANT_COLLECTION_PEOPLE, 0),
            "objects": stats.get(settings.QDRANT_COLLECTION_OBJECTS, 0),
        }

    # ------------------------------------------------------------------
    # Objects collection
    # ------------------------------------------------------------------

    def upsert_object(self, object_id: str, vector: List[float], payload: Dict[str, Any]) -> bool:
        try:
            self.client.upsert(
                collection_name=settings.QDRANT_COLLECTION_OBJECTS,
                points=[models.PointStruct(id=str(_to_uuid(object_id)), vector=vector, payload=payload)],
            )
            return True
        except Exception as e:
            logger.error("Object upsert failed: %s", e)
            return False

    def latest_object_location(self, object_class: str) -> Optional[Dict[str, Any]]:
        try:
            result = self.client.query_points(
                collection_name=settings.QDRANT_COLLECTION_OBJECTS,
                query=[0.0] * 128,
                query_filter=models.Filter(
                    must=[models.FieldCondition(key="object_class", match=models.MatchValue(value=object_class))]
                ),
                limit=1,
                with_payload=True,
            )
            if result.points:
                p = result.points[0]
                return {"object_id": _from_uuid(p.id), **(p.payload or {})}
        except Exception as e:
            logger.error("Object location query failed: %s", e)
        return None

    def delete_object(self, object_id: str) -> bool:
        try:
            self.client.delete(
                collection_name=settings.QDRANT_COLLECTION_OBJECTS,
                points_selector=models.PointIdsList(points=[str(_to_uuid(object_id))]),
            )
            return True
        except Exception as e:
            logger.error("Object delete failed: %s", e)
            return False

    def list_objects(self) -> List[Dict[str, Any]]:
        try:
            result = []
            scroll_result = self.client.scroll(
                collection_name=settings.QDRANT_COLLECTION_OBJECTS,
                limit=1000,
                with_payload=True,
                with_vectors=False,
            )
            for point in scroll_result[0]:
                result.append({"object_id": _from_uuid(point.id), **(point.payload or {})})
            return result
        except Exception as e:
            logger.error("Object scroll failed: %s", e)
            return []


qdrant_service = QdrantService()
