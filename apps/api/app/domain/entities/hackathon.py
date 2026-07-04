import dataclasses
from datetime import datetime
from uuid import UUID
from enum import Enum

class ParticipationMode(str, Enum):
    INDIVIDUAL = "individual"
    TEAM = "team"
    BOTH = "both"


class MetricType(str, Enum):
    RMSE = "rmse"
    F1_SCORE = "f1_score"
    ACCURACY = "accuracy"

@dataclasses.dataclass(slots=True)
class HackathonEntity:
    id: UUID
    name: str
    description: str
    rules: str
    start_time: datetime | None
    end_time: datetime | None
    participation_mode: ParticipationMode
    created_by: int
    created_at: datetime
    updated_at: datetime | None = None


@dataclasses.dataclass(slots=True)
class HackathonTaskEntity:
    id: UUID
    hackathon_id: UUID
    name: str
    problem_description_md: str
    private_test_url: str
    public_test_url: str
    metric_type: MetricType
    max_submissions: int
    created_at: datetime
    updated_at: datetime | None = None