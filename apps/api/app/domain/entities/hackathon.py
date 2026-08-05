import dataclasses
from datetime import datetime
from uuid import UUID
from enum import Enum


class ParticipationMode(str, Enum):
    INDIVIDUAL = "individual"
    TEAM = "team"
    BOTH = "both"


class MetricType(str, Enum):
    ACCURACY = "accuracy"
    BALANCED_ACCURACY = "balanced_accuracy"
    PRECISION = "precision"
    RECALL = "recall"
    F1_SCORE = "f1_score"
    F1_MACRO = "f1_macro"
    F1_WEIGHTED = "f1_weighted"
    ROC_AUC = "roc_auc"
    LOG_LOSS = "log_loss"
    MAE = "mae"
    MSE = "mse"
    RMSE = "rmse"
    R2 = "r2"
    MAPE = "mape"

    @property
    def lower_is_better(self) -> bool:
        return self in {
            MetricType.LOG_LOSS,
            MetricType.MAE,
            MetricType.MSE,
            MetricType.RMSE,
            MetricType.MAPE,
        }


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
    max_team_members: int = 5
    updated_at: datetime | None = None

    def is_registration_open(self) -> bool:
        if not self.start_time:
            return True
        return datetime.now() < self.start_time


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


class RegistrationStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


@dataclasses.dataclass(slots=True)
class HackathonTeamEntity:
    id: UUID
    hackathon_id: UUID
    name: str
    code: str
    leader_id: int
    member_ids: list[int]
    created_at: datetime


@dataclasses.dataclass(slots=True)
class HackathonRegistrationEntity:
    id: UUID
    hackathon_id: UUID
    user_id: int | None
    team_id: UUID | None
    status: RegistrationStatus
    registered_at: datetime
    reviewed_by: int | None = None
    rejection_reason: str | None = None
