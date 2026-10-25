import dataclasses
from datetime import datetime
from typing import Any
from uuid import UUID

from app.core.datetime_utils import now_ict
from app.domain.value_objects import GameSessionStatus
from app.domain.value_objects.gamification import (
    GamificationState,
    QuestionMeta,
)


@dataclasses.dataclass(init=False)
class GameSessionEntity:
    id: UUID
    user_id: int
    lesson_slug: str
    started_at: datetime
    completed_at: datetime | None
    status: GameSessionStatus
    question_limit: int = 10
    final_score: float = 0.0
    gold_earned: int = 0
    total_time_response: float = 0.0
    attempt_count: int = 1
    current_tier: int = 1
    question_sequence: list[QuestionMeta] = dataclasses.field(default_factory=list)
    gamification: GamificationState = dataclasses.field(default_factory=GamificationState)

    def __init__(
        self,
        id: UUID,
        user_id: int,
        lesson_slug: str = "",
        started_at: datetime | None = None,
        completed_at: datetime | None = None,
        status: GameSessionStatus = GameSessionStatus.IN_PROGRESS,
        question_limit: int = 10,
        final_score: float = 0.0,
        gold_earned: int = 0,
        total_time_response: float = 0.0,
        attempt_count: int = 1,
        current_tier: int = 1,
        question_sequence: list[QuestionMeta] | None = None,
        gamification: GamificationState | None = None,
        **kwargs: Any,
    ) -> None:
        self.id = id
        self.user_id = user_id
        self.started_at = started_at or now_ict()
        self.completed_at = completed_at
        self.status = status
        self.lesson_slug = str(lesson_slug or kwargs.get("lesson_slug", ""))
        self.question_limit = question_limit
        self.final_score = final_score
        self.gold_earned = gold_earned
        self.total_time_response = total_time_response
        self.attempt_count = attempt_count
        self.current_tier = current_tier
        self.question_sequence = question_sequence or []
        self.gamification = gamification or GamificationState()
        self.sync_metrics()

    def sync_metrics(self) -> None:
        """Synchronize native scoring/ranking columns with gamification state."""
        self.final_score = float(self.gamification.final_score)
        self.gold_earned = int(self.gamification.gold)
        self.total_time_response = float(self.gamification.total_time_response)
        self.attempt_count = int(self.gamification.attempt_count)
        self.current_tier = int(self.gamification.current_tier)

    @property
    def current_question_meta(self) -> QuestionMeta | None:
        idx = self.gamification.last_question_index
        if 0 <= idx < len(self.question_sequence):
            return self.question_sequence[idx]
        return None

    @property
    def is_all_answered(self) -> bool:
        return self.gamification.last_question_index >= len(self.question_sequence)

    @property
    def is_game_over(self) -> bool:
        return self.gamification.is_game_over(len(self.question_sequence))
