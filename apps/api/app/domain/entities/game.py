import dataclasses
from datetime import datetime
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
        question_sequence: list[QuestionMeta] | None = None,
        gamification: GamificationState | None = None,
        final_score: float | None = None,
        gold_earned: int | None = None,
        total_time_response: float | None = None,
        attempt_count: int | None = None,
        current_tier: int | None = None,
    ) -> None:
        self.id = id
        self.user_id = user_id
        self.started_at = started_at or now_ict()
        self.completed_at = completed_at
        self.status = status
        self.lesson_slug = str(lesson_slug)
        self.question_limit = question_limit
        self.question_sequence = question_sequence or []
        self.gamification = gamification or GamificationState()

        # Seed metrics into gamification if caller passed legacy keyword arguments
        if final_score is not None and not self.gamification.final_score:
            self.gamification.final_score = float(final_score)
        if gold_earned is not None and not self.gamification.gold:
            self.gamification.gold = int(gold_earned)
        if total_time_response is not None and not self.gamification.total_time_response:
            self.gamification.total_time_response = float(total_time_response)
        if attempt_count is not None and self.gamification.attempt_count == 1:
            self.gamification.attempt_count = int(attempt_count)
        if current_tier is not None and self.gamification.current_tier == 1:
            self.gamification.current_tier = int(current_tier)

    @property
    def final_score(self) -> float:
        return float(self.gamification.final_score)

    @property
    def gold_earned(self) -> int:
        return int(self.gamification.gold)

    @property
    def total_time_response(self) -> float:
        return float(self.gamification.total_time_response)

    @property
    def attempt_count(self) -> int:
        return int(self.gamification.attempt_count)

    @property
    def current_tier(self) -> int:
        return int(self.gamification.current_tier)

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
