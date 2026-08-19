# NeuroTwin Backend — Dockerfile
# Multi-stage build for Python 3.12 + onnxruntime + piper

FROM python:3.12-slim AS base

# System dependencies for onnxruntime, piper, and audio processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libsndfile1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app/ app/
COPY .env.example .env

# Create required directories
RUN mkdir -p data static/audio static/photos models/qdrant

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
