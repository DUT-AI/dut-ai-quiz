from datetime import datetime
from typing import Protocol
from uuid import UUID

from app.domain.entities.auth_session import AuthSessionEntity, RefreshTokenEntity


class IAuthSessionRepository(Protocol):
    async def add(self, session: AuthSessionEntity, token_hash: str) -> None: ...

    async def lock_by_token(
        self, token_hash: str
    ) -> tuple[AuthSessionEntity, RefreshTokenEntity] | None: ...

    async def rotate(self, token_hash: str, new_hash: str, now: datetime) -> None: ...

    async def revoke(self, session_id: UUID, now: datetime) -> None: ...

    async def commit(self) -> None: ...
