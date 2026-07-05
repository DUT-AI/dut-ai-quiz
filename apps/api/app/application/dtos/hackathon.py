from datetime import datetime
from uuid import UUID
from pydantic import BaseModel

from app.application.dtos.user import UserOut
from app.domain.entities.hackathon import RegistrationStatus


class HackathonTeamOutDTO(BaseModel):
    id: UUID
    hackathon_id: UUID
    name: str
    code: str
    leader_id: int
    member_ids: list[int]
    members: list[UserOut] = []
    created_at: datetime


class HackathonRegistrationOutDTO(BaseModel):
    id: UUID
    hackathon_id: UUID
    user_id: int | None = None
    team_id: UUID | None = None
    status: RegistrationStatus
    registered_at: datetime
    reviewed_by: int | None = None
    rejection_reason: str | None = None

    team: HackathonTeamOutDTO | None = None
    user: UserOut | None = None


class HackathonRegistrationStatusOutDTO(BaseModel):
    is_registered: bool
    registration: HackathonRegistrationOutDTO | None = None
    team: HackathonTeamOutDTO | None = None
