from datetime import datetime
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import Enum, Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as pgUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.datetime_utils import now_ict
from app.domain.entities.game import GameSessionEntity
from app.domain.value_objects import GameSessionStatus
from app.domain.value_objects.gamification import GamificationState, QuestionMeta

from .base import Base


class GameSession(Base):
    __tablename__ = "game_sessions"

    id: Mapped[UUID] = mapped_column(pgUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    lesson_slug: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    status: Mapped[GameSessionStatus] = mapped_column(
        Enum(GameSessionStatus, name="practicesessionstatus"),
        default=GameSessionStatus.IN_PROGRESS,
        nullable=False,
    )
    started_at: Mapped[datetime] = mapped_column(default=now_ict, nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(nullable=True)
    question_limit: Mapped[int] = mapped_column(default=10, server_default="10", nullable=False)

    # Scoring & Ranking Metrics
    final_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    gold_earned: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_time_response: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    attempt_count: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    current_tier: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    # Structured Sequence & Runtime Gamification State
    question_sequence: Mapped[list[dict[str, Any]]] = mapped_column(
        JSONB, nullable=False, default=list
    )
    gamification_state: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)

    def to_entity(self) -> GameSessionEntity:
        question_sequence = [
            QuestionMeta.from_dict(q) for q in (self.question_sequence or []) if isinstance(q, dict)
        ]
        gamification = GamificationState.from_dict(self.gamification_state or {})

        return GameSessionEntity(
            id=self.id,
            user_id=self.user_id,
            lesson_slug=self.lesson_slug,
            started_at=self.started_at,
            completed_at=self.completed_at,
            status=self.status,
            question_limit=self.question_limit,
            final_score=self.final_score,
            gold_earned=self.gold_earned,
            total_time_response=self.total_time_response,
            attempt_count=self.attempt_count,
            current_tier=self.current_tier,
            question_sequence=question_sequence,
            gamification=gamification,
        )

    @classmethod
    def from_entity(cls, entity: GameSessionEntity) -> "GameSession":
        entity.sync_metrics()
        return cls(
            id=entity.id,
            user_id=entity.user_id,
            lesson_slug=entity.lesson_slug,
            started_at=entity.started_at,
            completed_at=entity.completed_at,
            status=entity.status,
            question_limit=entity.question_limit,
            final_score=entity.final_score,
            gold_earned=entity.gold_earned,
            total_time_response=entity.total_time_response,
            attempt_count=entity.attempt_count,
            current_tier=entity.current_tier,
            question_sequence=[q.to_dict() for q in entity.question_sequence],
            gamification_state=entity.gamification.to_dict(),
        )
