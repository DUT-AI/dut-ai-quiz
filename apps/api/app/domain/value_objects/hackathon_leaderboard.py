from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

@dataclass(slots=True)
class HackathonLeaderboardRow:
    rank: int
    participant_id: str
    participant_type: str
    user_id: int
    team_id: UUID | None
    task_scores: dict[str, float]
    total_score: float
    total_inference_time: float
    latest_submission_time: datetime | None

    def to_dict(self) -> dict:
        return {
            "rank": self.rank,
            "participant_id": self.participant_id,
            "participant_type": self.participant_type,
            "user_id": self.user_id,
            "team_id": str(self.team_id) if self.team_id else None,
            "task_scores": self.task_scores,
            "total_score": self.total_score,
            "total_inference_time": self.total_inference_time,
            "latest_submission_time": self.latest_submission_time.isoformat()
            if self.latest_submission_time
            else None,
        }

