from datetime import UTC, datetime
from uuid import uuid4

from app.application.dtos.auth import AuthTokens
from app.domain.entities.auth_session import AuthSessionEntity
from app.domain.interfaces.auth_session_repo import IAuthSessionRepository
from app.domain.interfaces.token_service import ITokenService


class AuthSessionService:
    def __init__(
        self, repository: IAuthSessionRepository, tokens: ITokenService
    ) -> None:
        self._repository = repository
        self._tokens = tokens

    def issue(
        self, session: AuthSessionEntity, roles: list[str], now: datetime
    ) -> AuthTokens:
        access_expires_at = min(now + self._tokens.access_lifetime, session.expires_at)
        claims = {
            "user_id": session.user_id,
            "roles": roles or ["guest"],
            "type": "service_a" if session.user_source == "MANAGE" else "google",
            "user_source": session.user_source,
            "sid": str(session.id),
            "jti": str(uuid4()),
            "iat": int(now.timestamp()),
        }
        return AuthTokens(
            access_token=self._tokens.create_access(claims, access_expires_at),
            refresh_token=self._tokens.create_refresh(),
            expires_in=max(0, int((access_expires_at - now).total_seconds())),
            refresh_expires_in=max(0, int((session.expires_at - now).total_seconds())),
        )

    async def create(
        self, user_id: int, user_source: str, roles: list[str]
    ) -> AuthTokens:
        now = datetime.now(UTC)
        session = AuthSessionEntity(
            id=uuid4(),
            user_id=user_id,
            user_source=user_source,
            expires_at=now + self._tokens.refresh_lifetime,
        )
        tokens = self.issue(session, roles, now)
        await self._repository.add(
            session, self._tokens.hash_refresh(tokens.refresh_token)
        )
        await self._repository.commit()
        return tokens
