from datetime import datetime
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.auth_session import AuthSessionEntity, RefreshTokenEntity
from app.infrastructure.persistence.models.auth_session import AuthSession, RefreshToken


class AuthSessionRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add(self, session: AuthSessionEntity, token_hash: str) -> None:
        self._session.add(AuthSession(**vars(session)))
        await self._session.flush()
        self._session.add(RefreshToken(token_hash=token_hash, session_id=session.id))
        await self._session.flush()

    async def lock_by_token(
        self, token_hash: str
    ) -> tuple[AuthSessionEntity, RefreshTokenEntity] | None:
        session_id = await self._session.scalar(
            select(RefreshToken.session_id).where(RefreshToken.token_hash == token_hash)
        )
        if session_id is None:
            return None
        # All rotations and logout for the same family serialize on this row.
        session = await self._session.scalar(
            select(AuthSession)
            .where(AuthSession.id == session_id)
            .with_for_update()
            .execution_options(populate_existing=True)
        )
        if session is None:
            return None
        token = await self._session.get(
            RefreshToken, token_hash, populate_existing=True
        )
        if token is None:
            return None
        return (
            AuthSessionEntity(
                id=session.id,
                user_id=session.user_id,
                user_source=session.user_source,
                expires_at=session.expires_at,
                revoked_at=session.revoked_at,
            ),
            RefreshTokenEntity(token.token_hash, token.session_id, token.used_at),
        )

    async def rotate(self, token_hash: str, new_hash: str, now: datetime) -> None:
        token = await self._session.get(RefreshToken, token_hash)
        if token is None or token.used_at is not None:
            raise RuntimeError("Refresh rotation requires a locked, unused token")
        token.used_at = now
        self._session.add(
            RefreshToken(token_hash=new_hash, session_id=token.session_id)
        )
        await self._session.flush()

    async def revoke(self, session_id: UUID, now: datetime) -> None:
        await self._session.execute(
            update(AuthSession)
            .where(AuthSession.id == session_id, AuthSession.revoked_at.is_(None))
            .values(revoked_at=now)
        )

    async def commit(self) -> None:
        # Persist rotation/replay revocation before sending cookies or a 401.
        await self._session.commit()
