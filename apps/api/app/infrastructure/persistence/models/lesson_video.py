from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID as pgUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.datetime_utils import now_ict
from app.domain.entities.lesson_video import LessonVideoEntity

from .base import Base


class LessonVideo(Base):
    """SQLAlchemy model representing a reference video attached to a lesson."""

    __tablename__ = "lesson_videos"

    id: Mapped[UUID] = mapped_column(
        pgUUID(as_uuid=True), primary_key=True, default=uuid4
    )
    lesson_id: Mapped[UUID] = mapped_column(
        pgUUID(as_uuid=True),
        ForeignKey("lessons.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    url: Mapped[str] = mapped_column(Text, nullable=False)
    youtube_video_id: Mapped[str] = mapped_column(
        String(32), nullable=False, index=True
    )
    start_seconds: Mapped[int] = mapped_column(
        default=0, server_default="0", nullable=False
    )
    order: Mapped[int] = mapped_column(default=0, server_default="0", nullable=False)
    description: Mapped[str] = mapped_column(
        Text, default="", server_default="", nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(default=now_ict, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        default=now_ict, onupdate=now_ict, nullable=False
    )

    def to_entity(self) -> LessonVideoEntity:
        """Convert database model to domain entity."""
        return LessonVideoEntity(
            id=self.id,
            lesson_id=self.lesson_id,
            title=self.title,
            url=self.url,
            youtube_video_id=self.youtube_video_id,
            start_seconds=self.start_seconds,
            order=self.order,
            description=self.description,
            created_at=self.created_at,
            updated_at=self.updated_at,
        )

    @classmethod
    def from_entity(cls, entity: LessonVideoEntity) -> "LessonVideo":
        """Create database model from domain entity."""
        return cls(
            id=entity.id,
            lesson_id=entity.lesson_id,
            title=entity.title,
            url=entity.url,
            youtube_video_id=entity.youtube_video_id,
            start_seconds=entity.start_seconds,
            order=entity.order,
            description=entity.description,
            created_at=entity.created_at or now_ict(),
            updated_at=entity.updated_at or now_ict(),
        )
