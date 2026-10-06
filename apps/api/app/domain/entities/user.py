from dataclasses import dataclass, field
from datetime import datetime
from enum import StrEnum


class UserSource(StrEnum):
    MANAGE = "MANAGE"
    INTERNAL = "INTERNAL"
    GOOGLE = "GOOGLE"


@dataclass
class UserEntity:
    email: str
    role: str
    google_id: str
    id: int | None = None
    name: str | None = None
    avatar_url: str | None = None
    created_at: datetime | None = None
    roles: list[str] = field(default_factory=list)
    user_source: UserSource = UserSource.INTERNAL

    @property
    def is_manage_user(self) -> bool:
        return self.user_source == UserSource.MANAGE
