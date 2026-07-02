from app.domain.value_objects import PracticeSessionStatus
from datetime import datetime
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import String
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.dialects.postgresql import UUID as pgUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.datetime_utils import now_ict
from app.domain.entities.practice import PracticeSessionEntity

from .base import Base


class PracticeSession(Base):
    __tablename__ = "practice_sessions"

    id: Mapped[UUID] = mapped_column(
        pgUUID(as_uuid=True), primary_key=True, default=uuid4
    )
    user_id: Mapped[int] = mapped_column(index=True)
    started_at: Mapped[datetime] = mapped_column(default=now_ict)
    completed_at: Mapped[datetime | None] = mapped_column(nullable=True)
    status: Mapped[PracticeSessionStatus] = mapped_column(
        default=PracticeSessionStatus.IN_PROGRESS
    )
    snapshot: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    tags_filter: Mapped[list[str]] = mapped_column(
        ARRAY(String()), nullable=False, default=list
    )
    question_limit: Mapped[int] = mapped_column(default=10, server_default="10")

    def to_entity(self) -> PracticeSessionEntity:
        return PracticeSessionEntity(
            id=self.id,
            user_id=self.user_id,
            started_at=self.started_at,
            completed_at=self.completed_at,
            status=self.status,
            snapshot=self.snapshot,
            tags_filter=self.tags_filter,
            question_limit=self.question_limit,
        )

    @classmethod
    def from_entity(cls, entity: PracticeSessionEntity) -> "PracticeSession":
        return cls(
            id=entity.id,
            user_id=entity.user_id,
            started_at=entity.started_at,
            completed_at=entity.completed_at,
            status=entity.status,
            snapshot=entity.snapshot,
            tags_filter=entity.tags_filter,
            question_limit=entity.question_limit,
        )
