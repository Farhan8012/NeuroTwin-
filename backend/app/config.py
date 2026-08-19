from pydantic_settings import BaseSettings
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    PROJECT_NAME: str = "NeuroTwin Backend"
    VERSION: str = "0.2.0"
    API_V1_STR: str = "/api/v1"
    BASE_DIR: Path = BASE_DIR

    # Qdrant Vector Database
    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333
    QDRANT_COLLECTION_PEOPLE: str = "people"
    QDRANT_COLLECTION_OBJECTS: str = "objects"
    QDRANT_FACE_DIM: int = 512

    # AI Engine Thresholds
    FACE_MATCH_THRESHOLD: float = 0.50

    # LLM Engine ('ollama' or 'groq')
    LLM_PROVIDER: str = "ollama"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "qwen3:8b"
    GROQ_API_KEY: str = ""

    # Model paths (bundled locally on the M4 host)
    MODELS_DIR: Path = BASE_DIR / "models"
    INSIGHTFACE_HOME: Path = MODELS_DIR / "insightface"
    WHISPER_MODEL: str = "base"
    WHISPER_DOWNLOAD_ROOT: Path = MODELS_DIR / "whisper"
    PIPER_MODEL_PATH: Path = MODELS_DIR / "piper" / "en_US-lessac-medium.onnx"
    PIPER_CONFIG_PATH: Path = MODELS_DIR / "piper" / "en_US-lessac-medium.onnx.json"

    # Storage
    STATIC_DIR: Path = BASE_DIR / "static"
    AUDIO_OUT_DIR: Path = STATIC_DIR / "audio"
    PHOTO_OUT_DIR: Path = STATIC_DIR / "photos"
    UPLOAD_DIR: Path = BASE_DIR / "uploads"

    # Visual context cache TTL (seconds) for conversational continuity
    CONTEXT_CACHE_TTL: int = 120

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


settings = Settings()