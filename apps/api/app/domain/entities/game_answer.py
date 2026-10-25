import dataclasses
from datetime import datetime
from uuid import UUID


@dataclasses.dataclass(frozen=True)
class GameSessionAnswerEntity:
    id: UUID
    session_id: UUID
    question_id: UUID
    option_id: str
    is_correct: bool
    time_response: float
    points_gained: int
    gold_gained: int
    answered_at: datetime
