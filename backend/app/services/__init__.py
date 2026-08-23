from app.services.dns_patch import apply_dns_patch
apply_dns_patch()

from app.services.qdrant_service import qdrant_service  # noqa: F401
from app.services.face_service import face_service  # noqa: F401
from app.services.llm_service import llm_service  # noqa: F401
from app.services.object_service import object_detection_service  # noqa: F401
