from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "NeuroTwin Backend"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    
    # Qdrant Vector Database
    QDRANT_HOST: str = os.getenv("QDRANT_HOST", "localhost")
    QDRANT_PORT: int = int(os.getenv("QDRANT_PORT", "6333"))
    QDRANT_COLLECTION_PEOPLE: str = "people"
    QDRANT_COLLECTION_OBJECTS: str = "objects"
    
    # AI Engine Thresholds & Models
    FACE_MATCH_THRESHOLD: float = 0.90
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "ollama")  # 'ollama' or 'groq'
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "qwen3:8b")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")

    class Config:
        case_sensitive = True

settings = Settings()
