from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, field_validator
from app.domain.entities.hackathon import MetricType

ParticipationMode = Literal["individual", "team", "both"]


class HackathonCreate(BaseModel):
    name: str
    description: str = ""
    rules: str = ""
    start_time: datetime | None = None
    end_time: datetime | None = None
    participation_mode: ParticipationMode = "both"


class HackathonUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    rules: str | None = None
    start_time: datetime | None = None
    end_time: datetime | None = None
    participation_mode: ParticipationMode | None = None


class HackathonOut(BaseModel):
    id: UUID
    name: str
    description: str
    rules: str
    start_time: datetime | None
    end_time: datetime | None
    participation_mode: ParticipationMode
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
                if normalized.lower() == member.value.lower() or normalized.upper() == member.name.upper():
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
                if normalized.lower() == member.value.lower() or normalized.upper() == member.name.upper():
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
