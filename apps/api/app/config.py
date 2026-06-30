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

    database_url: str = "postgresql+asyncpg://dutai_dev:dutai_dev@127.0.0.1:6070/quizdb_dev"

    manage_base_url: str = ""
    manage_api_key: str = ""

    cors_origins: str = "http://localhost:3000,https://quiz.dutai.site"

    redis_host: str = "redis://127.0.0.1:6379/0"
    redis_port: int = 6379

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

    @field_validator("database_url")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        if value.startswith("postgresql://"):
            return value.replace("postgresql://", "postgresql+asyncpg://", 1)
        return value

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()