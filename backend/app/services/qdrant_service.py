import logging
from typing import List, Dict, Any, Optional
from qdrant_client import QdrantClient
from qdrant_client.http import models
from app.config import settings

logger = logging.getLogger(__name__)

class QdrantService:
    def __init__(self):
        try:
            self.client = QdrantClient(host=settings.QDRANT_HOST, port=settings.QDRANT_PORT)
            self._init_collections()
            self.is_connected = True
        except Exception as e:
            logger.warning(f"Qdrant DB connection failed, using in-memory mode: {e}")
            self.client = QdrantClient(":memory:")
            self._init_collections()
            self.is_connected = False

    def _init_collections(self):
        """Initialize 'people' (512-d face vectors) and 'objects' collections."""
        try:
            collections = [c.name for c in self.client.get_collections().collections]
            
            # 1. People Collection (InsightFace 512-d Cosine Distance)
            if settings.QDRANT_COLLECTION_PEOPLE not in collections:
                self.client.create_collection(
                    collection_name=settings.QDRANT_COLLECTION_PEOPLE,
                    vectors_config=models.VectorParams(
                        size=512,
                        distance=models.Distance.COSINE
                    )
                )
                logger.info("Created Qdrant collection: people")

            # 2. Objects Collection (Location tracking)
            if settings.QDRANT_COLLECTION_OBJECTS not in collections:
                self.client.create_collection(
                    collection_name=settings.QDRANT_COLLECTION_OBJECTS,
                    vectors_config=models.VectorParams(
                        size=128,
                        distance=models.Distance.COSINE
                    )
                )
                logger.info("Created Qdrant collection: objects")
        except Exception as e:
            logger.error(f"Failed initializing Qdrant collections: {e}")

    def search_face(self, face_vector: List[float], limit: int = 1) -> Optional[Dict[str, Any]]:
        """Search for a matching person by face vector using Cosine Similarity."""
        try:
            results = self.client.search(
                collection_name=settings.QDRANT_COLLECTION_PEOPLE,
                query_vector=face_vector,
                limit=limit,
                score_threshold=settings.FACE_MATCH_THRESHOLD
            )
            if results:
                match = results[0]
                return {
                    "person_id": match.id,
                    "score": match.score,
                    "payload": match.payload
                }
        except Exception as e:
            logger.error(f"Qdrant face search failed: {e}")
        return None

    def upsert_person(self, point_id: str, face_vector: List[float], payload: Dict[str, Any]) -> bool:
        """Index a person's face vector and metadata payload into Qdrant."""
        try:
            self.client.upsert(
                collection_name=settings.QDRANT_COLLECTION_PEOPLE,
                points=[
                    models.PointStruct(
                        id=point_id,
                        vector=face_vector,
                        payload=payload
                    )
                ]
            )
            return True
        except Exception as e:
            logger.error(f"Qdrant upsert failed: {e}")
            return False

qdrant_service = QdrantService()