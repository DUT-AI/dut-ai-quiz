import dataclasses
from datetime import datetime


@dataclasses.dataclass(slots=True)
class ManageUserEntity:
    user_id: int
    user_name: str
    email: str
    user_avatar_url: str | None = None

@dataclasses.dataclass(slots=True)
class ManageTeamEntity:
    id: int
    team_name: str
    created_at: datetime
    updated_at: datetime
    member_count: int
    members: list[ManageUserEntity]


@dataclasses.dataclass(slots=True, frozen=True)
class ManageAuthTokens:
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


@dataclasses.dataclass(slots=True)
class ManageUserProfile:
    id: int
    name: str
    email: str
    avatar_url: str | None = None
    role_names: list[str] = dataclasses.field(default_factory=list)
    permissions: list[str] = dataclasses.field(default_factory=list)
