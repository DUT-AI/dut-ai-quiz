from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

API_DIR = Path(__file__).resolve().parents[1]
ROOT_DIR = Path(__file__).resolve().parents[3]

ROOT_ENV_PATH = ROOT_DIR / ".env"
API_ENV_PATH = API_DIR / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(ROOT_ENV_PATH, API_ENV_PATH),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    database_url: str = (
        "postgresql+asyncpg://dutai_dev:dutai_dev@127.0.0.1:6070/quizdb_dev"
    )

    manage_base_url: str = ""
    manage_api_key: str = ""

    cors_origins: str = "http://localhost:3000,https://quiz.dutai.site"

    redis_url: str = "redis://127.0.0.1:6379/0"

    auth_cache_ttl: int = 600

    jwt_secret_key: str = "fallback-secret-key-for-jwt-signing-change-in-prod"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440

    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/api/v1/auth/google/callback"
    frontend_url: str = "http://localhost:3000"

    api_host: str = "0.0.0.0"
    api_port: int = 8000

    auth_dev_bypass: bool = False
    auth_dev_user_id: int = 1
    auth_dev_role_name: str = "admin"

    minio_endpoint: str = ""
    minio_secure: bool = True
    minio_access_key: str = ""
    minio_secret_key: str = ""
    minio_bucket_name: str = ""
    presigned_url_expire_seconds: int = 3600

    # Lesson semantic search. DUT-AI's Vietnamese SBERT service is the default;
    # local hashing and OpenAI-compatible providers remain available for dev.
    embedding_enabled: bool = True
    embedding_provider: str = "dutai"
    embedding_api_url: str = "https://embedding.dutai.site/v1/embeddings"
    embedding_api_key: str = ""
    embedding_model: str = "keepitreal/vietnamese-sbert"
    embedding_dimensions: int = 768
    embedding_batch_size: int = 64
    embedding_timeout_seconds: float = 30.0
    lesson_chunk_target_tokens: int = 180
    lesson_chunk_max_tokens: int = 220
    related_lesson_min_score: float = 0.25

    # ================= SUBMISSION SYSTEM CONFIG =================
    submission_cooldown_seconds: int = 300  # 5 minutes
    submission_max_quota: int = 20  # Max 20 submissions per contest
    sandbox_timeout_seconds: int = 900  # 15 minutes
    sandbox_mem_limit: str = "4g"  # 4GB RAM
    sandbox_cpu_limit: int = 2000000000  # 2 vCPUs (nano_cpus = CPU * 1e9)
    sandbox_image_name: str = "python:3.12-slim"
    log_max_lines: int = 50
    max_script_size_bytes: int = 10 * 1024 * 1024  # 10 MB
    max_model_size_bytes: int = 1024 * 1024 * 1024  # 1 GB

    @field_validator("database_url")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        if value.startswith("postgresql://"):
            return value.replace("postgresql://", "postgresql+asyncpg://", 1)
        return value

    @property
    def cors_origin_list(self) -> list[str]:
        return [
            origin.strip() for origin in self.cors_origins.split(",") if origin.strip()
        ]


settings = Settings()
