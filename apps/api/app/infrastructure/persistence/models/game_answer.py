from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as pgUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.datetime_utils import now_ict
from app.domain.entities.game_answer import GameSessionAnswerEntity

from .base import Base


class GameSessionAnswer(Base):
    __tablename__ = "game_session_answers"

    id: Mapped[UUID] = mapped_column(pgUUID(as_uuid=True), primary_key=True, default=uuid4)
    session_id: Mapped[UUID] = mapped_column(
        pgUUID(as_uuid=True),
        ForeignKey("game_sessions.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    question_id: Mapped[UUID] = mapped_column(
        pgUUID(as_uuid=True),
        ForeignKey("questions.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )
    option_id: Mapped[UUID] = mapped_column(pgUUID(as_uuid=True), nullable=False)
    is_correct: Mapped[bool] = mapped_column(Boolean, nullable=False)
    time_response: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    points_gained: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    gold_gained: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    answered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=now_ict, nullable=False
    )

    __table_args__ = (
        UniqueConstraint("session_id", "question_id", name="uq_game_session_answer_turn"),
    )

    def to_entity(self) -> GameSessionAnswerEntity:
        return GameSessionAnswerEntity(
            id=self.id,
            session_id=self.session_id,
            question_id=self.question_id,
            option_id=self.option_id,
            is_correct=self.is_correct,
            time_response=self.time_response,
            points_gained=self.points_gained,
            gold_gained=self.gold_gained,
            answered_at=self.answered_at,
        )

    @classmethod
    def from_entity(cls, entity: GameSessionAnswerEntity) -> "GameSessionAnswer":
        return cls(
            id=entity.id,
            session_id=entity.session_id,
            question_id=entity.question_id,
            option_id=entity.option_id,
            is_correct=entity.is_correct,
            time_response=entity.time_response,
            points_gained=entity.points_gained,
            gold_gained=entity.gold_gained,
            answered_at=entity.answered_at,
        )
