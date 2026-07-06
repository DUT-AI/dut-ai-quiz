from datetime import datetime
from uuid import UUID, uuid4
from sqlalchemy import Boolean, Float, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID as pgUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.domain.entities.runtime_profile import RuntimeProfileEntity
from .base import Base


class RuntimeProfile(Base):
    __tablename__ = "runtime_profiles"

    id: Mapped[UUID] = mapped_column(
        pgUUID(as_uuid=True), primary_key=True, default=uuid4
    )
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    display_name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", server_default="")
    docker_image: Mapped[str] = mapped_column(String(500), nullable=False)
    docker_image_tag: Mapped[str] = mapped_column(String(100), nullable=False)
    python_version: Mapped[str | None] = mapped_column(String(50), nullable=True)
    cuda_version: Mapped[str | None] = mapped_column(String(50), nullable=True)
    allowed_packages_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    cpu_limit: Mapped[float] = mapped_column(Float, default=2.0, server_default="2.0")
    memory_limit_mb: Mapped[int] = mapped_column(Integer, default=2048, server_default="2048")
    gpu_enabled: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    gpu_limit: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    timeout_seconds: Mapped[int] = mapped_column(Integer, default=300, server_default="300")
    pids_limit: Mapped[int] = mapped_column(Integer, default=100, server_default="100")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true", index=True)
    created_at: Mapped[datetime] = mapped_column(nullable=False)
    updated_at: Mapped[datetime | None] = mapped_column(nullable=True)

    def to_entity(self) -> RuntimeProfileEntity:
        return RuntimeProfileEntity(
            id=self.id,
            name=self.name,
            display_name=self.display_name,
            description=self.description,
            docker_image=self.docker_image,
            docker_image_tag=self.docker_image_tag,
            python_version=self.python_version,
            cuda_version=self.cuda_version,
            allowed_packages_json=self.allowed_packages_json,
            cpu_limit=self.cpu_limit,
            memory_limit_mb=self.memory_limit_mb,
            gpu_enabled=self.gpu_enabled,
            gpu_limit=self.gpu_limit,
            timeout_seconds=self.timeout_seconds,
            pids_limit=self.pids_limit,
            is_active=self.is_active,
            created_at=self.created_at,
            updated_at=self.updated_at,
        )

    @classmethod
    def from_entity(cls, entity: RuntimeProfileEntity) -> "RuntimeProfile":
        return cls(
            id=entity.id,
            name=entity.name,
            display_name=entity.display_name,
            description=entity.description,
            docker_image=entity.docker_image,
            docker_image_tag=entity.docker_image_tag,
            python_version=entity.python_version,
            cuda_version=entity.cuda_version,
            allowed_packages_json=entity.allowed_packages_json,
            cpu_limit=entity.cpu_limit,
            memory_limit_mb=entity.memory_limit_mb,
            gpu_enabled=entity.gpu_enabled,
            gpu_limit=entity.gpu_limit,
            timeout_seconds=entity.timeout_seconds,
            pids_limit=entity.pids_limit,
            is_active=entity.is_active,
            created_at=entity.created_at,
            updated_at=entity.updated_at,
        )
