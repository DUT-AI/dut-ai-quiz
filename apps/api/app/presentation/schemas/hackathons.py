from datetime import datetime
from typing import Literal
from uuid import UUID

from app.domain.entities.hackathon import MetricType, RegistrationStatus
from pydantic import BaseModel, field_validator

ParticipationMode = Literal["individual", "team", "both"]


class HackathonCreate(BaseModel):
    name: str
    description: str = ""
    rules: str = ""
    start_time: datetime | None = None
    end_time: datetime | None = None
    participation_mode: ParticipationMode = "both"
    max_team_members: int = 5


class HackathonUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    rules: str | None = None
    start_time: datetime | None = None
    end_time: datetime | None = None
    participation_mode: ParticipationMode | None = None
    max_team_members: int | None = None


class HackathonOut(BaseModel):
    id: UUID
    name: str
    description: str
    rules: str
    start_time: datetime | None
    end_time: datetime | None
    participation_mode: ParticipationMode
    max_team_members: int
    created_by: int

    model_config = {"from_attributes": True}


class HackathonTaskCreate(BaseModel):
    name: str
    problem_description_md: str
    private_test_url: str
    public_test_url: str
    metric_type: MetricType
    max_submissions: int

    @field_validator("metric_type", mode="before")
    @classmethod
    def normalize_metric_type(cls, value):
        if isinstance(value, MetricType):
            return value
        if isinstance(value, str):
            normalized = value.strip()
            if not normalized:
                raise ValueError("metric_type must not be empty")
            for member in MetricType:
                if (
                    normalized.lower() == member.value.lower()
                    or normalized.upper() == member.name.upper()
                ):
                    return member
        return value


class HackathonTaskUpdate(BaseModel):
    name: str | None = None
    problem_description_md: str | None = None
    private_test_url: str | None = None
    public_test_url: str | None = None
    metric_type: MetricType | None = None
    max_submissions: int | None = None

    @field_validator("metric_type", mode="before")
    @classmethod
    def normalize_metric_type(cls, value):
        if value is None or isinstance(value, MetricType):
            return value
        if isinstance(value, str):
            normalized = value.strip()
            if not normalized:
                raise ValueError("metric_type must not be empty")
            for member in MetricType:
                if (
                    normalized.lower() == member.value.lower()
                    or normalized.upper() == member.name.upper()
                ):
                    return member
        return value


class HackathonTaskOut(BaseModel):
    id: UUID
    hackathon_id: UUID
    name: str
    problem_description_md: str
    private_test_url: str
    public_test_url: str
    metric_type: MetricType
    max_submissions: int
    created_at: datetime
    updated_at: datetime | None

    model_config = {"from_attributes": True}


class TeamMemberOut(BaseModel):
    id: int
    name: str
    email: str
    avatar_url: str | None = None

    model_config = {"from_attributes": True}


class HackathonTeamOut(BaseModel):
    id: UUID
    hackathon_id: UUID
    name: str
    code: str
    leader_id: int
    member_ids: list[int]
    members: list[TeamMemberOut] = []
    created_at: datetime

    model_config = {"from_attributes": True}


class HackathonRegistrationOut(BaseModel):
    id: UUID
    hackathon_id: UUID
    user_id: int | None
    team_id: UUID | None
    status: RegistrationStatus
    registered_at: datetime
    reviewed_by: int | None = None
    rejection_reason: str | None = None

    team: HackathonTeamOut | None = None
    user: TeamMemberOut | None = None

    model_config = {"from_attributes": True}


class HackathonTeamCreate(BaseModel):
    name: str


class JoinTeamInput(BaseModel):
    code: str


class LeaveTeamInput(BaseModel):
    new_leader_id: int | None = None


class ReviewRegistrationInput(BaseModel):
    status: RegistrationStatus
    rejection_reason: str | None = None
