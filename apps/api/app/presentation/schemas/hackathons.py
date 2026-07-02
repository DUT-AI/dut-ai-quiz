from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel

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
