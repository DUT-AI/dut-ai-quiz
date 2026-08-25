from pathlib import Path

from pydantic import AliasChoices, Field, field_validator
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
        populate_by_name=True,
    )

    database_url: str = (
        "postgresql+asyncpg://dutai_dev:dutai_dev@127.0.0.1:6070/quizdb_dev"
    )

    manage_base_url: str = ""
    manage_api_key: str = ""
    third_party_api_keys: str = ""

    cors_origins: str = "http://localhost:3000,https://quiz.dutai.site"

    redis_url: str = "redis://127.0.0.1:6379/0"
    hackathon_queue_name: str = "arq:hackathon"
    lesson_index_queue_name: str = "arq:lesson-index"
    homework_queue_name: str = "arq:homework"

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

    # S3-compatible object storage. MINIO_* aliases remain supported so existing
    # deployments can migrate without an all-at-once environment change.
    s3_endpoint: str = Field(
        default="",
        validation_alias=AliasChoices("S3_ENDPOINT", "MINIO_ENDPOINT"),
    )
    s3_access_key: str = Field(
        default="",
        validation_alias=AliasChoices("S3_ACCESS_KEY", "MINIO_ACCESS_KEY"),
    )
    s3_secret_key: str = Field(
        default="",
        validation_alias=AliasChoices("S3_SECRET_KEY", "MINIO_SECRET_KEY"),
    )
    s3_region: str = Field(
        default="us-east-1",
        validation_alias=AliasChoices("S3_REGION", "AWS_DEFAULT_REGION"),
    )
    s3_bucket_name: str = Field(
        default="",
        validation_alias=AliasChoices("S3_BUCKET_NAME", "MINIO_BUCKET_NAME"),
    )
    s3_force_path_style: bool = True
    s3_secure: bool = Field(
        default=True,
        validation_alias=AliasChoices("S3_SECURE", "MINIO_SECURE"),
    )
    presigned_url_expire_seconds: int = 3600

    # Homework submission and external evaluation services.
    homework_checker_api_url: str = ""
    submission_checker_api_url: str = ""
    homework_grading_enabled: bool = True
    homework_grading_pass_score: float = 7.0
    homework_grading_max_attachment_bytes: int = 20 * 1024 * 1024
    homework_grading_max_source_bytes: int = 5 * 1024 * 1024
    homework_grading_max_source_chars: int = 200_000
    homework_grading_max_files: int = 50
    homework_grading_max_archive_entries: int = 500
    homework_plagiarism_threshold: float = 0.8
    homework_max_file_size_bytes: int = 10 * 1024 * 1024
    homework_grading_timeout_seconds: float = 300.0
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
    related_question_min_score: float = 0.5

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

    # ================= GOOGLE GENAI / GEMMA API KEY =============
    gemini_api_key: str = Field(
        default="",
        validation_alias=AliasChoices("GEMINI_API_KEY", "GOOGLE_API_KEY"),
    )

    # ================= PDF IMPORT CONFIG ========================
    pdf_max_size_mb: int = 20
    pdf_max_pages: int = 5
    pdf_image_min_px: int = 80          # Ignore images smaller than 80x80px
    pdf_duplicate_threshold: float = 0.85
    review_lock_ttl_seconds: int = 60
    review_lock_heartbeat_seconds: int = 30
    pdf_upload_bucket: str = "lms-dev"  # Same MinIO bucket
    pdf_images_prefix: str = "uploads/pdf-images"

    @field_validator("database_url")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        if value.startswith("postgresql://"):
            return value.replace("postgresql://", "postgresql+asyncpg://", 1)
        return value

    @field_validator("s3_endpoint")
    @classmethod
    def normalize_s3_endpoint(cls, value: str) -> str:
        return value.strip().rstrip("/")

    @property
    def s3_endpoint_url(self) -> str:
        if not self.s3_endpoint:
            return ""
        if "://" in self.s3_endpoint:
            return self.s3_endpoint
        scheme = "https" if self.s3_secure else "http"
        return f"{scheme}://{self.s3_endpoint}"

    @property
    def s3_is_configured(self) -> bool:
        return bool(
            self.s3_endpoint_url
            and self.s3_access_key
            and self.s3_secret_key
            and self.s3_bucket_name
        )

    @property
    def cors_origin_list(self) -> list[str]:
        return [
            origin.strip().rstrip("/")
            for origin in self.cors_origins.split(",")
            if origin.strip()
        ]

    @property
    def third_party_api_key_list(self) -> list[str]:
        keys = [k.strip() for k in self.third_party_api_keys.split(",") if k.strip()]
        if self.manage_api_key.strip() and self.manage_api_key.strip() not in keys:
            keys.append(self.manage_api_key.strip())
        return keys


settings = Settings()
