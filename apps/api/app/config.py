from pathlib import Path
from typing import ClassVar

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
    quiz_webhook_secret: str = ""

    third_party_api_keys: str = ""

    cors_origins: str = "http://localhost:3000,https://quiz.dutai.site,https://lms.dutai.io.vn,https://workspace.dutai.io.vn"

    redis_url: str = "redis://127.0.0.1:6379/0"
    hackathon_queue_name: str = "arq:hackathon"
    lesson_index_queue_name: str = "arq:lesson-index"
    homework_queue_name: str = "arq:homework"

    auth_cache_ttl: int = 600

    jwt_secret_key: str = "fallback-secret-key-for-jwt-signing-change-in-prod"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = Field(default=15, ge=1)
    jwt_refresh_expire_days: int = Field(default=7, ge=1)
    cookie_domain: str | None = None

    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/api/v1/auth/google/callback"
    frontend_url: str = "http://localhost:3000"

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
    s3_region: str = "us-east-1"
    s3_bucket_name: str = Field(
        default="",
        validation_alias=AliasChoices("S3_BUCKET_NAME", "MINIO_BUCKET_NAME"),
    )
    s3_force_path_style: bool = True
    s3_secure: bool = Field(
        default=True,
        validation_alias=AliasChoices("S3_SECURE", "MINIO_SECURE"),
    )
    s3_public_endpoint: str = Field(
        default="",
        validation_alias=AliasChoices("S3_PUBLIC_ENDPOINT", "MINIO_PUBLIC_ENDPOINT"),
    )
    s3_public_secure: bool = Field(
        default=True,
        validation_alias=AliasChoices("S3_PUBLIC_SECURE", "MINIO_PUBLIC_SECURE"),
    )
    presigned_url_expire_seconds: int = 3600

    # Homework grading policy is fixed in code rather than deployment config.
    homework_grading_enabled: ClassVar[bool] = True
    homework_grading_model: ClassVar[str] = "gemma-4-31b-it"
    homework_grading_pass_score: ClassVar[float] = 7.0
    homework_grading_max_attachment_bytes: ClassVar[int] = 20 * 1024 * 1024
    homework_grading_max_source_bytes: ClassVar[int] = 5 * 1024 * 1024
    homework_grading_max_files: ClassVar[int] = 50
    homework_grading_max_archive_entries: ClassVar[int] = 500
    homework_plagiarism_threshold: ClassVar[float] = 0.8
    homework_max_file_size_bytes: ClassVar[int] = 20 * 1024 * 1024
    homework_grading_timeout_seconds: float = Field(default=900.0, gt=0)
    homework_grading_max_attempts: int = Field(default=3, ge=1, le=10)
    homework_grading_max_chunks: int = Field(default=32, ge=1, le=128)
    homework_grading_chunk_chars: int = Field(default=80_000, ge=1000)
    homework_notebook_output_max_chars: int = Field(default=25_000, ge=1000)

    # Lesson semantic search and reranking.
    # DUT-AI's TEI service (BAAI/bge-m3 + BAAI/bge-reranker-v2-m3) is the default;
    # local hashing and OpenAI-compatible providers remain available for dev.
    embedding_enabled: bool = True
    embedding_provider: str = "dutai"
    embedding_api_url: str = "https://textembedding.dutai.io.vn/embed"
    embedding_api_key: str = ""
    embedding_model: str = "BAAI/bge-m3"
    embedding_dimensions: int = 1024
    embedding_batch_size: int = 16
    embedding_timeout_seconds: float = 60.0
    lesson_chunk_target_tokens: int = 250
    lesson_chunk_max_tokens: int = 400
    related_lesson_min_score: float = 0.25
    related_question_min_score: float = 0.5

    # Reranking configuration
    rerank_enabled: bool = True
    rerank_provider: str = "dutai"
    rerank_api_url: str = "https://textembedding.dutai.io.vn/rerank"
    rerank_api_key: str = ""
    rerank_model: str = "BAAI/bge-reranker-v2-m3"
    rerank_batch_size: int = 32
    rerank_timeout_seconds: float = 30.0

    # ================= SUBMISSION SYSTEM CONFIG =================
    sandbox_timeout_seconds: int = 900  # 15 minutes
    sandbox_mem_limit: str = "4g"  # 4GB RAM
    sandbox_cpu_limit: int = 2000000000  # 2 vCPUs (nano_cpus = CPU * 1e9)
    sandbox_image_name: str = "python:3.12-slim"
    log_max_lines: int = 50

    # ================= HOMEWORK LLM EVALUATION CONFIG ============
    homework_llm_provider: str = "openai"
    homework_llm_api_url: str = ""
    homework_llm_api_key: str = ""
    homework_llm_model: str = "ggml-org/gemma-4-e4b-it-GGUF:Q4_0"
    homework_llm_temperature: float = 0.1
    homework_llm_timeout_seconds: float = 120.0
    homework_llm_context_tokens: int = Field(default=66_816, ge=2048)
    homework_llm_max_output_tokens: int = Field(default=2048, ge=256)
    homework_llm_token_margin: int = Field(default=512, ge=0)
    # Bound native tokenizer payloads independently of the model's token budget.
    homework_llm_max_tokenizer_bytes: int = Field(default=260_000, ge=4096)
    # Native llama.cpp endpoint root; empty means derive it from the chat URL.
    homework_llm_tokenizer_url: str = ""

    # ================= GOOGLE GENAI / GEMMA API KEY =============
    gemini_api_key: str = ""

    # ================= PDF IMPORT CONFIG ========================
    pdf_max_size_mb: int = 20
    pdf_image_min_px: int = 80  # Ignore images smaller than 80x80px
    review_lock_ttl_seconds: int = 60
    pdf_upload_bucket: str = "lms-dev"  # Same MinIO bucket
    pdf_images_prefix: str = "uploads/pdf-images"

    @field_validator("database_url")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        if value.startswith("postgresql://"):
            return value.replace("postgresql://", "postgresql+asyncpg://", 1)
        return value

    @field_validator("s3_endpoint", "s3_public_endpoint")
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
    def s3_public_endpoint_url(self) -> str:
        if not self.s3_public_endpoint:
            return self.s3_endpoint_url
        if "://" in self.s3_public_endpoint:
            return self.s3_public_endpoint
        scheme = "https" if self.s3_public_secure else "http"
        return f"{scheme}://{self.s3_public_endpoint}"

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
        if (
            self.quiz_webhook_secret.strip()
            and self.quiz_webhook_secret.strip() not in keys
        ):
            keys.append(self.quiz_webhook_secret.strip())
        return keys


settings = Settings()
