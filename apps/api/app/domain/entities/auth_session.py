from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass
class AuthSessionEntity:
    id: UUID
    user_id: int
    user_source: str
    expires_at: datetime
    revoked_at: datetime | None = None


@dataclass
class RefreshTokenEntity:
    token_hash: str
    session_id: UUID
    used_at: datetime | None = None
