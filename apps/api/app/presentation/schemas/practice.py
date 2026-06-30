from pydantic import BaseModel
from uuid import UUID
from typing import Any

class GamificationStartIn(BaseModel):
    lesson_slug: str

from pydantic import Field

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

