from pydantic import BaseModel
from uuid import UUID

class ScoreDistributionItem(BaseModel):
    range: str
    count: int

class ParticipantStat(BaseModel):
    user_id: int
    best_score: float | None
    attempts_count: int
    last_status: str
    max_tab_out: int

class QuestionStat(BaseModel):
    question_id: UUID
    content: str
    correct_rate: float

class ExamSummary(BaseModel):
    total_assigned: int
    total_started: int
    total_completed: int
    average_score: float
    max_score: float

class ExamStatsOut(BaseModel):
    summary: ExamSummary
    score_distribution: list[ScoreDistributionItem]
    participants: list[ParticipantStat]
    question_stats: list[QuestionStat]
