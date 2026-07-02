from datetime import datetime
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.dialects.postgresql import UUID as pgUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.datetime_utils import now_ict
from app.domain.entities.question import QuestionEntity, QuestionOptionEntity
from app.domain.value_objects import Difficulty, PoolType

from .base import Base


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[UUID] = mapped_column(
        pgUUID(as_uuid=True), primary_key=True, default=uuid4
    )
    pool_type: Mapped[PoolType] = mapped_column(index=True)
    difficulty: Mapped[Difficulty] = mapped_column(
        default=Difficulty.EASY,
        server_default=Difficulty.EASY.value,
        index=True,
    )
    content: Mapped[str] = mapped_column(default="", server_default="")
    options: Mapped[list[dict[str, Any]]] = mapped_column(
        JSONB, nullable=False, default=list
    )
    solution: Mapped[str | None] = mapped_column(nullable=True)
    tags: Mapped[list[str]] = mapped_column(
        ARRAY(String()), nullable=False, default=list
    )
    lesson_id: Mapped[UUID | None] = mapped_column(
        pgUUID(as_uuid=True), ForeignKey("lessons.id"), index=True, nullable=True
    )
    created_by: Mapped[int] = mapped_column(index=True)
    created_at: Mapped[datetime] = mapped_column(default=now_ict)

    def to_entity(self) -> QuestionEntity:
        return QuestionEntity(
            id=self.id,
            pool_type=self.pool_type,
            difficulty=self.difficulty,
            content=self.content,
            options=[QuestionOptionEntity.from_dict(opt) for opt in self.options],
            solution=self.solution,
            lesson_id=self.lesson_id,
            tags=self.tags,
            created_by=self.created_by,
            created_at=self.created_at,
        )

    @classmethod
    def from_entity(cls, entity: QuestionEntity) -> "Question":
        return cls(
            id=entity.id,
            pool_type=entity.pool_type,
            difficulty=entity.difficulty,
            content=entity.content,
            options=[opt.to_dict() for opt in entity.options],
            solution=entity.solution,
            lesson_id=entity.lesson_id,
            tags=entity.tags,
            created_by=entity.created_by,
            created_at=entity.created_at,
        )
