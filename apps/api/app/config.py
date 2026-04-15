from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "postgresql+asyncpg://dutai:dutai@localhost:5432/quizdb"
    manage_base_url: str = "https://manage.dutai.site"
    manage_auth_me_path: str = "/api/v1/auth/me"
    cors_origins: str = "http://localhost:3000,https://quiz.dutai.site"

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

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
