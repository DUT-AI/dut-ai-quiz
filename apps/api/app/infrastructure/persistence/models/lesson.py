from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID as pgUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.datetime_utils import now_ict
from app.domain.entities.lesson import LessonEntity

from .base import Base


class Lesson(Base):
    """SQLAlchemy model representing a lesson in the database."""

    __tablename__ = "lessons"

    id: Mapped[UUID] = mapped_column(pgUUID(as_uuid=True), primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column()
    description: Mapped[str] = mapped_column(default="", server_default="")
    content_md: Mapped[str] = mapped_column(Text, nullable=False, default="", server_default="")
    order: Mapped[int] = mapped_column(default=0, server_default="0")
    slug: Mapped[str | None] = mapped_column(default=None, nullable=True, unique=True, index=True)
    module_id: Mapped[UUID | None] = mapped_column(
        pgUUID(as_uuid=True),
        ForeignKey("modules.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(default=now_ict)

    def to_entity(self) -> LessonEntity:
        """Convert database model to domain entity."""
        return LessonEntity(
            id=self.id,
            name=self.name,
            description=self.description,
            order=self.order,
            slug=self.slug,
            created_at=self.created_at,
            module_id=self.module_id,
            content_md=self.content_md,
        )

    @classmethod
    def from_entity(cls, entity: LessonEntity) -> "Lesson":
        """Create database model from domain entity."""
        return cls(
            id=entity.id,
            name=entity.name,
            description=entity.description,
            content_md=entity.content_md or "",
            order=entity.order,
            slug=entity.slug,
            module_id=entity.module_id,
            created_at=entity.created_at,
        )
