from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy.dialects.postgresql import UUID as pgUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.datetime_utils import now_ict
from app.domain.entities.lesson import LessonEntity

from .base import Base


class Lesson(Base):
    __tablename__ = "lessons"

    id: Mapped[UUID] = mapped_column(
        pgUUID(as_uuid=True), primary_key=True, default=uuid4
    )
    name: Mapped[str] = mapped_column()
    description: Mapped[str] = mapped_column(default="", server_default="")
    content_md: Mapped[str] = mapped_column(default="", server_default="")
    order: Mapped[int] = mapped_column(default=0, server_default="0")
    created_at: Mapped[datetime] = mapped_column(default=now_ict)

    def to_entity(self) -> LessonEntity:
        return LessonEntity(
            id=self.id,
            name=self.name,
            description=self.description,
            content_md=self.content_md,
            order=self.order,
            created_at=self.created_at,
        )

    @classmethod
    def from_entity(cls, entity: LessonEntity) -> "Lesson":
        return cls(
            id=entity.id,
            name=entity.name,
            description=entity.description,
            content_md=entity.content_md,
            order=entity.order,
            created_at=entity.created_at,
        )