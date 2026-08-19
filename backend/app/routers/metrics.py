"""Prometheus-compatible metrics endpoint.

Exposes /metrics in OpenMetrics text format for scraping by Prometheus.

Tracks:
- Request count and latency per endpoint
- Face recognition match rate
- Voice query processing time
- Active people count
- System health indicators
"""

import time
import psutil
from fastapi import APIRouter, Response

from app.config import settings
from app.services import qdrant_service, people_store

router = APIRouter(tags=["Metrics"])

# Simple in-memory counters (resets on restart — use Prometheus client for production)
_metrics = {
    "requests_total": 0,
    "face_matches_total": 0,
    "face_misses_total": 0,
    "voice_queries_total": 0,
    "voice_query_duration_sum": 0.0,
    "frame_uploads_total": 0,
    "frame_duration_sum": 0.0,
}

_start_time = time.time()


def record_request():
    _metrics["requests_total"] += 1


def record_face_match():
    _metrics["face_matches_total"] += 1


def record_face_miss():
    _metrics["face_misses_total"] += 1


def record_voice_query(duration_s: float):
    _metrics["voice_queries_total"] += 1
    _metrics["voice_query_duration_sum"] += duration_s


def record_frame_upload(duration_s: float):
    _metrics["frame_uploads_total"] += 1
    _metrics["frame_duration_sum"] += duration_s


@router.get("/metrics")
async def metrics():
    """Return Prometheus-compatible metrics in OpenMetrics text format."""
    vm = psutil.virtual_memory()
    uptime = time.time() - _start_time
    people_count = len(people_store.list_people())
    qdrant_stats = qdrant_service.collection_stats()

    lines = [
        "# HELP neurotwin_uptime_seconds Total uptime in seconds.",
        "# TYPE neurotwin_uptime_seconds gauge",
        f"neurotwin_uptime_seconds {uptime:.1f}",
        "",
        "# HELP neurotwin_requests_total Total HTTP requests handled.",
        "# TYPE neurotwin_requests_total counter",
        f"neurotwin_requests_total {_metrics['requests_total']}",
        "",
        "# HELP neurotwin_face_matches_total Total face recognition matches.",
        "# TYPE neurotwin_face_matches_total counter",
        f"neurotwin_face_matches_total {_metrics['face_matches_total']}",
        "",
        "# HELP neurotwin_face_misses_total Total face recognition misses.",
        "# TYPE neurotwin_face_misses_total counter",
        f"neurotwin_face_misses_total {_metrics['face_misses_total']}",
        "",
        "# HELP neurotwin_voice_queries_total Total voice queries processed.",
        "# TYPE neurotwin_voice_queries_total counter",
        f"neurotwin_voice_queries_total {_metrics['voice_queries_total']}",
        "",
        "# HELP neurotwin_voice_query_duration_seconds Average voice query duration.",
        "# TYPE neurotwin_voice_query_duration_seconds gauge",
        f"neurotwin_voice_query_duration_seconds {_metrics['voice_query_duration_sum'] / max(_metrics['voice_queries_total'], 1):.3f}",
        "",
        "# HELP neurotwin_frame_uploads_total Total frame uploads processed.",
        "# TYPE neurotwin_frame_uploads_total counter",
        f"neurotwin_frame_uploads_total {_metrics['frame_uploads_total']}",
        "",
        "# HELP neurotwin_frame_duration_seconds Average frame processing duration.",
        "# TYPE neurotwin_frame_duration_seconds gauge",
        f"neurotwin_frame_duration_seconds {_metrics['frame_duration_sum'] / max(_metrics['frame_uploads_total'], 1):.3f}",
        "",
        "# HELP neurotwin_people_registered Number of registered people.",
        "# TYPE neurotwin_people_registered gauge",
        f"neurotwin_people_registered {people_count}",
        "",
        "# HELP neurotwin_qdrant_people_vectors Number of vectors in Qdrant people collection.",
        "# TYPE neurotwin_qdrant_people_vectors gauge",
        f"neurotwin_qdrant_people_vectors {qdrant_stats.get('people', 0)}",
        "",
        "# HELP neurotwin_qdrant_objects_vectors Number of vectors in Qdrant objects collection.",
        "# TYPE neurotwin_qdrant_objects_vectors gauge",
        f"neurotwin_qdrant_objects_vectors {qdrant_stats.get('objects', 0)}",
        "",
        "# HELP neurotwin_cpu_percent Current CPU usage percentage.",
        "# TYPE neurotwin_cpu_percent gauge",
        f"neurotwin_cpu_percent {psutil.cpu_percent(interval=0.1)}",
        "",
        "# HELP neurotwin_memory_used_bytes Current memory usage in bytes.",
        "# TYPE neurotwin_memory_used_bytes gauge",
        f"neurotwin_memory_used_bytes {vm.used}",
        "",
        "# HELP neurotwin_memory_total_bytes Total memory in bytes.",
        "# TYPE neurotwin_memory_total_bytes gauge",
        f"neurotwin_memory_total_bytes {vm.total}",
        "",
    ]

    return Response(content="\n".join(lines), media_type="text/plain; charset=utf-8")
