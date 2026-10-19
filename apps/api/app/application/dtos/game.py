from datetime import datetime

from pydantic import BaseModel


class GameLeaderboardRowDTO(BaseModel):
    user_id: int
    username: str | None = None
    avatar_url: str | None = None
    final_score: float
    gold: int
    total_time_response: float
    attempt_count: int
    is_completed: bool = False
    total_questions: int = 0
    answered_questions: int = 0
    completed_at: datetime | None = None
