from datetime import datetime
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as pgUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.datetime_utils import now_ict
from app.domain.entities.attempt import (
    AttemptAnswerEntity,
    AttemptEntity,
    FocusEventEntity,
)
from app.domain.value_objects import ShuffledSnapshot

from .base import AttemptStatus, Base


class Attempt(Base):
    __tablename__ = "attempts"

    id: Mapped[UUID] = mapped_column(
        pgUUID(as_uuid=True), primary_key=True, default=uuid4
    )
    exam_id: Mapped[UUID] = mapped_column(ForeignKey("exams.id"), index=True)
    user_id: Mapped[int] = mapped_column(index=True)
    started_at: Mapped[datetime] = mapped_column(default=now_ict)
    completed_at: Mapped[datetime | None] = mapped_column(nullable=True)
    expires_at: Mapped[datetime] = mapped_column()
    score: Mapped[float | None] = mapped_column(nullable=True)
    status: Mapped[AttemptStatus] = mapped_column(
        default=AttemptStatus.IN_PROGRESS, index=True
    )
    tab_out_count: Mapped[int] = mapped_column(default=0, server_default="0")
    shuffle_seed: Mapped[int | None] = mapped_column(nullable=True)
    shuffle_snapshot: Mapped[dict[str, Any] | None] = mapped_column(
        JSONB, nullable=True
    )

    def to_entity(self) -> AttemptEntity:
        return AttemptEntity(
            id=self.id,
            exam_id=self.exam_id,
            user_id=self.user_id,
            started_at=self.started_at,
            completed_at=self.completed_at,
            expires_at=self.expires_at,
            score=self.score,
            status=self.status,
            tab_out_count=self.tab_out_count,
            shuffle_seed=self.shuffle_seed,
            shuffle_snapshot=(
                ShuffledSnapshot.from_dict(self.shuffle_snapshot)
                if self.shuffle_snapshot
                else None
            ),
        )

    @classmethod
    def from_entity(cls, entity: AttemptEntity) -> "Attempt":
        return cls(
            id=entity.id,
            exam_id=entity.exam_id,
            user_id=entity.user_id,
            started_at=entity.started_at,
            completed_at=entity.completed_at,
            expires_at=entity.expires_at,
            score=entity.score,
            status=entity.status,
            tab_out_count=entity.tab_out_count,
            shuffle_seed=entity.shuffle_seed,
            shuffle_snapshot=(
                entity.shuffle_snapshot.to_dict() if entity.shuffle_snapshot else None
            ),
        )


class AttemptAnswer(Base):
    __tablename__ = "attempt_answers"

    id: Mapped[UUID] = mapped_column(
        pgUUID(as_uuid=True), primary_key=True, default=uuid4
    )
    attempt_id: Mapped[UUID] = mapped_column(ForeignKey("attempts.id"), index=True)
    question_id: Mapped[UUID] = mapped_column(ForeignKey("questions.id"), index=True)
    selected_option_id: Mapped[str | None] = mapped_column(nullable=True)

    def to_entity(self) -> AttemptAnswerEntity:

        return AttemptAnswerEntity(
            id=self.id,
            attempt_id=self.attempt_id,
            question_id=self.question_id,
            selected_option_id=self.selected_option_id,
        )

    @classmethod
    def from_entity(cls, entity: AttemptAnswerEntity) -> "AttemptAnswer":
        return cls(
            id=entity.id,
            attempt_id=entity.attempt_id,
            question_id=entity.question_id,
            selected_option_id=entity.selected_option_id,
        )


class FocusEvent(Base):
    __tablename__ = "focus_events"
    __table_args__ = (
        UniqueConstraint("attempt_id", "client_event_id", name="uq_focus_client"),
    )

    id: Mapped[UUID] = mapped_column(
        pgUUID(as_uuid=True), primary_key=True, default=uuid4
    )
    attempt_id: Mapped[UUID] = mapped_column(ForeignKey("attempts.id"), index=True)
    client_event_id: Mapped[str] = mapped_column()
    event: Mapped[str] = mapped_column(default="", server_default="")
    received_at: Mapped[datetime] = mapped_column(default=now_ict)

    def to_entity(self) -> FocusEventEntity:

        return FocusEventEntity(
            id=self.id,
            attempt_id=self.attempt_id,
            client_event_id=self.client_event_id,
            event=self.event,
            received_at=self.received_at,
        )

    @classmethod
    def from_entity(cls, entity: FocusEventEntity) -> "FocusEvent":
        return cls(
            id=entity.id,
            attempt_id=entity.attempt_id,
            client_event_id=entity.client_event_id,
            event=entity.event,
            received_at=entity.received_at,
        )
