from pathlib import Path
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# root/apps/api/app/config.py -> parent x 4 = root/
ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
ENV_PATH = ROOT_DIR / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ENV_PATH, env_file_encoding="utf-8", extra="ignore"
    )

    database_url: str = "postgresql+asyncpg://dutai:dutai@localhost:5432/quizdb"
    manage_base_url: str = ""
    manage_api_key: str = ""

    cors_origins: str = "http://localhost:3000,https://quiz.dutai.site"

    redis_host: str = "localhost"
    redis_port: int = 6379

    auth_cache_ttl: int = 600  # 10 minutes

    # JWT Configs
    jwt_secret_key: str = "fallback-secret-key-for-jwt-signing-change-in-prod"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440  # 24 hours

    # Google OAuth Configs
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

    @field_validator("redis_port", mode="before")
    @classmethod
    def _default_redis_port(cls, value):
        if value in (None, ""):
            return 6379
        return value

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
