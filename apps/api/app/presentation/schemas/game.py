from datetime import datetime
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


class GameQuestionOptionOut(BaseModel):
    id: str
    text: str


class GameQuestionSnapshotOut(BaseModel):
    id: str
    content: str
    options: list[GameQuestionOptionOut] = Field(default_factory=list)
    time_limit: int = 60
    time_response: float = 0.0
    tier: int = 1
    is_boss: bool = False

    model_config = {"from_attributes": True}


class GamificationStateOut(BaseModel):
    lives: int = 3
    gold: int = 0
    points: int = 0
    current_tier: int = 1
    last_question_index: int = 0
    boss_hp: int = 0
    shield_used_in_tier: dict[str, bool] = Field(default_factory=dict)
    total_time_response: float = 0.0
    correct_count: int = 0
    final_score: float = 0.0
    attempt_count: int = 1

    model_config = {"from_attributes": True}


class GameSessionSnapshotOut(BaseModel):
    lesson_slug: str = ""
    questions: list[GameQuestionSnapshotOut] = Field(default_factory=list)
    answers: dict[str, str] = Field(default_factory=dict)
    gamification: GamificationStateOut = Field(default_factory=GamificationStateOut)

    model_config = {"from_attributes": True}


class GamificationAnswerResultOut(BaseModel):
    is_correct: bool
    points_gained: int
    coins_gained: int
    updated_gamification: GamificationStateOut
    is_game_over: bool
    correct_option_id: str | None = None
    next_question: GameQuestionSnapshotOut | None = None
    snapshot: GameSessionSnapshotOut | None = None


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
    is_completed: bool = False
    total_questions: int = 0
    answered_questions: int = 0
    completed_at: datetime | None = None


class UserMatchHistoryItem(BaseModel):
    id: str
    attempt_number: int
    started_at: datetime
    completed_at: datetime | None = None
    final_score: float
    raw_points: int
    gold: int
    total_time_response: float
    correct_count: int
    total_questions: int
    accuracy_percentage: float
    max_streak: int = 0
    lives_left: int = 0
    is_completed: bool = True


class UserMatchHistoryResponse(BaseModel):
    user_id: int
    username: str | None = None
    avatar_url: str | None = None
    lesson_slug: str
    total_attempts: int
    highest_score: float
    total_gold: int
    history: list[UserMatchHistoryItem]


class GameSessionSyncOutDTO(BaseModel):
    session_id: str
    user_id: int
    completed_at: datetime
    final_score: float
    gold: int
    attempt_count: int
    is_completed: bool
    total_questions: int = 0
    correct_count: int = 0


class GameSessionsSyncResponse(BaseModel):
    data: list[GameSessionSyncOutDTO]
    is_success: bool = True
