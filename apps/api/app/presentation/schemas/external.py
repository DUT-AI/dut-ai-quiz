from pydantic import BaseModel


class ExternalUserOut(BaseModel):
    id: int
    username: str
    name: str
    email: str
    avatar_url: str | None = None


class ExternalUsersResponse(BaseModel):
    data: list[ExternalUserOut]


class ExternalTeamMemberOut(BaseModel):
    user_id: int
    username: str


class ExternalTeamOut(BaseModel):
    id: int
    team_name: str
    member_count: int
    members: list[ExternalTeamMemberOut]


class ExternalTeamsResponse(BaseModel):
    data: list[ExternalTeamOut]
