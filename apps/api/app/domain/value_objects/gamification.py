from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import StrEnum
from typing import Any
from uuid import UUID

from app.core.datetime_utils import now_ict


class GamificationItem(StrEnum):
    MICROSCOPE = "microscope"
    DOUBLE_POINTS = "double_points"
    SHIELD = "shield"
    TIME_FREEZE = "time_freeze"


ITEM_PRICES: dict[GamificationItem, int] = {
    GamificationItem.MICROSCOPE: 50,  # Che 1/2 đáp án (bỏ 2 đáp án sai)
    GamificationItem.DOUBLE_POINTS: 100,  # Bùa nhân phẩm (x2 điểm)
    GamificationItem.SHIELD: 80,  # Khiên hộ mệnh (Bảo toàn mạng)
    GamificationItem.TIME_FREEZE: 40,  # Đóng băng thời gian
}


@dataclass
class QuestionSnapshot:
    id: str
    content: str
    options: list[dict[str, Any]] = field(default_factory=list)
    time_limit: int = 60
    time_response: float = 0.0
    tier: int = 1
    is_boss: bool = False

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "content": self.content,
            "options": self.options,
            "time_limit": self.time_limit,
            "time_response": self.time_response,
            "tier": self.tier,
            "is_boss": self.is_boss,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "QuestionSnapshot":
        return cls(
            id=str(data.get("id", "")),
            content=str(data.get("content", "")),
            options=list(data.get("options", [])),
            time_limit=int(data.get("time_limit", 60)),
            time_response=float(data.get("time_response", 0.0)),
            tier=int(data.get("tier", 1)),
            is_boss=bool(data.get("is_boss", False)),
        )


@dataclass
class GamificationState:
    lives: int = 3
    gold: int = 0
    points: int = 0
    current_tier: int = 1
    last_question_index: int = 0
    boss_hp: int = 0
    shield_used_in_tier: dict[str, bool] = field(default_factory=dict)
    current_question_started_at: str | None = None
    total_time_response: float = 0.0
    correct_count: int = 0
    final_score: float = 0.0
    attempt_count: int = 1

    @classmethod
    def get_item_price(cls, item: GamificationItem, is_boss: bool = False) -> int:
        multiplier = 2 if is_boss else 1
        return ITEM_PRICES[item] * multiplier

    def has_enough_gold(self, cost: int) -> bool:
        return self.gold >= cost

    def deduct_gold(self, amount: int) -> None:
        self.gold = max(0, self.gold - amount)

    def apply_time_freeze(self, seconds: int = 30) -> None:
        if self.current_question_started_at:
            started_at = datetime.fromisoformat(self.current_question_started_at)
            new_started_at = started_at + timedelta(seconds=seconds)
            self.current_question_started_at = new_started_at.isoformat()

    def can_use_shield_in_tier(self, tier: int) -> bool:
        return not self.shield_used_in_tier.get(str(tier), False)

    def record_shield_used(self, tier: int) -> None:
        self.shield_used_in_tier[str(tier)] = True

    def record_correct_answer(
        self,
        time_response: float,
        time_limit: int,
        is_boss: bool = False,
        double_points: bool = False,
    ) -> tuple[int, int]:
        base_points = 10
        speed_ratio = time_response / time_limit if time_limit > 0 else 1.0

        speed_points_bonus = 0
        speed_gold_bonus = 0
        if speed_ratio <= 0.3:
            speed_points_bonus = 5
            speed_gold_bonus = 15
        elif speed_ratio <= 0.6:
            speed_points_bonus = 2
            speed_gold_bonus = 5

        points_gained = base_points + speed_points_bonus
        coins_gained = 20 + speed_gold_bonus

        if is_boss:
            points_gained *= 2
        if double_points:
            points_gained *= 2

        self.points += points_gained
        self.gold += coins_gained
        self.correct_count += 1
        if is_boss:
            self.boss_hp = 0

        return points_gained, coins_gained

    def record_incorrect_answer(
        self,
        is_boss: bool = False,
        shield_activated: bool = False,
    ) -> None:
        if not shield_activated:
            lives_lost = 2 if is_boss else 1
            self.lives = max(0, self.lives - lives_lost)

    def add_time_response(self, time_response: float) -> None:
        self.total_time_response += time_response

    def advance_question(self, questions: list[QuestionSnapshot]) -> None:
        next_idx = self.last_question_index + 1
        self.last_question_index = next_idx

        if next_idx < len(questions):
            next_q = questions[next_idx]
            if next_q.tier > self.current_tier and self.lives > 0:
                self.lives = min(5, self.lives + 2)
                self.current_tier = next_q.tier
            self.boss_hp = 1 if next_q.is_boss else 0
        else:
            self.boss_hp = 0

    def is_game_over(self, total_questions: int) -> bool:
        return self.lives <= 0 or self.last_question_index >= total_questions

    def finalize_score(self, count_completed: int) -> None:
        decay = max(0.2, 1.0 - (count_completed * 0.2))
        self.final_score = self.points * decay
        self.attempt_count = count_completed + 1

    def reset_question_timer(self) -> None:
        self.current_question_started_at = now_ict().isoformat()

    def to_dict(self) -> dict[str, Any]:
        return {
            "lives": self.lives,
            "gold": self.gold,
            "points": self.points,
            "current_tier": self.current_tier,
            "last_question_index": self.last_question_index,
            "boss_hp": self.boss_hp,
            "shield_used_in_tier": dict(self.shield_used_in_tier),
            "current_question_started_at": self.current_question_started_at,
            "total_time_response": self.total_time_response,
            "correct_count": self.correct_count,
            "final_score": self.final_score,
            "attempt_count": self.attempt_count,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any] | None) -> "GamificationState":
        if not data:
            return cls()
        return cls(
            lives=int(data.get("lives", 3)),
            gold=int(data.get("gold", 0)),
            points=int(data.get("points", 0)),
            current_tier=int(data.get("current_tier", 1)),
            last_question_index=int(data.get("last_question_index", 0)),
            boss_hp=int(data.get("boss_hp", 0)),
            shield_used_in_tier=dict(data.get("shield_used_in_tier", {}) or {}),
            current_question_started_at=data.get("current_question_started_at"),
            total_time_response=float(data.get("total_time_response", 0.0)),
            correct_count=int(data.get("correct_count", 0)),
            final_score=float(data.get("final_score", 0.0)),
            attempt_count=int(data.get("attempt_count", 1)),
        )


@dataclass
class GameSessionSnapshot:
    lesson_slug: str = ""
    questions: list[QuestionSnapshot] = field(default_factory=list)
    answers: dict[str, str] = field(default_factory=dict)
    gamification: GamificationState = field(default_factory=GamificationState)

    def current_question(self) -> QuestionSnapshot | None:
        idx = self.gamification.last_question_index
        if 0 <= idx < len(self.questions):
            return self.questions[idx]
        return None

    def record_answer(
        self,
        question_id: str | UUID,
        option_id: str | UUID,
        time_response: float,
    ) -> None:
        qid_str = str(question_id)
        self.answers[qid_str] = str(option_id)
        curr = self.current_question()
        if curr and curr.id == qid_str:
            curr.time_response = time_response
        self.gamification.add_time_response(time_response)

    def is_all_answered(self) -> bool:
        return self.gamification.last_question_index >= len(self.questions)

    def is_game_over(self) -> bool:
        return self.gamification.is_game_over(len(self.questions))

    def is_100_percent_correct(self) -> bool:
        return len(self.questions) > 0 and self.gamification.correct_count >= len(self.questions)

    def to_dict(self) -> dict[str, Any]:
        return {
            "lesson_slug": self.lesson_slug,
            "questions": [q.to_dict() for q in self.questions],
            "answers": self.answers,
            "gamification": self.gamification.to_dict(),
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any] | None) -> "GameSessionSnapshot":
        if not data:
            return cls()
        return cls(
            lesson_slug=str(data.get("lesson_slug", "")),
            questions=[
                QuestionSnapshot.from_dict(q) for q in data.get("questions", [])
            ],
            answers=dict(data.get("answers", {}) or {}),
            gamification=GamificationState.from_dict(data.get("gamification", {}) or {}),
        )
