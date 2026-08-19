"""Simple API-key authentication for caregiver endpoints.

The patient-facing endpoints (`/health`, `/frame`, `/voice-query`) are left
open so the mobile client can call them without credentials.  All caregiver
CRUD endpoints (`/people`, `/memories`, `/medicines`, `/emergency-contacts`,
`/objects`) require the header ``X-API-Key`` to match the value in
``NEUROTWIN_API_KEY`` (set in ``.env`` or exported as an environment variable).

If ``NEUROTWIN_API_KEY`` is **not set**, authentication is disabled — useful for
local development.
"""

import os
import logging
from typing import Callable

from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

logger = logging.getLogger("neurotwin.auth")

API_KEY = os.getenv("NEUROTWIN_API_KEY", "")

# Paths that do NOT require authentication (patient-facing)
_OPEN_PATHS = frozenset({"/", "/docs", "/openapi.json", "/redoc"})

# Path prefixes that are always open (patient pipeline + health)
_OPEN_PREFIXES = ("/api/v1/health", "/api/v1/frame", "/api/v1/voice-query", "/static")


def _requires_auth(path: str) -> bool:
    """Return True if the path should be protected by API key."""
    if not API_KEY:
        return False
    for prefix in _OPEN_PREFIXES:
        if path.startswith(prefix):
            return False
    for open_path in _OPEN_PATHS:
        if path == open_path:
            return False
    return True


class APIKeyMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if _requires_auth(request.url.path):
            key = request.headers.get("X-API-Key", "")
            if key != API_KEY:
                logger.warning("Rejected request to %s — bad/missing API key", request.url.path)
                raise HTTPException(status_code=401, detail="Invalid or missing X-API-Key header")
        return await call_next(request)
