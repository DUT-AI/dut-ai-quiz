from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class GamificationStartIn(BaseModel):
    lesson_slug: str


class GamificationAnswerPatchIn(BaseModel):
    question_id: UUID
    option_id: str
    time_response: float = Field(..., ge=0, description="Time taken to answer in seconds")
    activate_shield: bool = False
    activate_double_points: bool = False

class GamificationUseItemIn(BaseModel):
    item_name: str
    question_id: UUID

class GamificationAnswerResultOut(BaseModel):
    is_correct: bool
    points_gained: int
    coins_gained: int
    updated_gamification: dict[str, Any]
    is_game_over: bool

class GameLessonSummaryOut(BaseModel):
    lesson_slug: str
    total_sessions: int
    completed_sessions: int
    highest_points: int
    total_gold_earned: int
    highest_tier: int


class GameLeaderboardRowOut(BaseModel):
    user_id: int
    username: str | None = None
    avatar_url: str | None = None
    final_score: float
    gold: int
    total_time_response: float
    attempt_count: int

