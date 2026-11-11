from datetime import UTC, datetime

from app.application.dtos.auth import AuthTokens
from app.application.services.auth_sessions import AuthSessionService
from app.config import settings
from app.domain.interfaces import IManageService, IUserRepository
from app.domain.interfaces.auth_session_repo import IAuthSessionRepository
from app.domain.interfaces.token_service import ITokenService


class RefreshTokensUseCase:
    def __init__(
        self,
        repository: IAuthSessionRepository,
        tokens: ITokenService,
        sessions: AuthSessionService,
        users: IUserRepository,
        manage: IManageService,
    ) -> None:
        self._repository = repository
        self._tokens = tokens
        self._sessions = sessions
        self._users = users
        self._manage = manage

    async def execute(self, refresh_token: str | None) -> AuthTokens | None:
        if not refresh_token:
            return None
        token_hash = self._tokens.hash_refresh(refresh_token)
        locked = await self._repository.lock_by_token(token_hash)
        if locked is None:
            return None
        session, token = locked
        now = datetime.now(UTC)
        if session.revoked_at or session.expires_at <= now:
            return None
        if token.used_at:
            await self._repository.revoke(session.id, now)
            await self._repository.commit()
            return None

        if settings.auth_dev_bypass:
            roles = [settings.auth_dev_role_name]
        elif session.user_source == "MANAGE":
            # Never extend a session using stale roles from the previous JWT.
            profile = await self._manage.get_profile(session.user_id)
            if profile is None:
                await self._repository.revoke(session.id, now)
                await self._repository.commit()
                return None
            roles = profile.role_names
        else:
            user = await self._users.get_by_id(session.user_id)
            if user is None:
                await self._repository.revoke(session.id, now)
                await self._repository.commit()
                return None
            roles = user.roles or [user.role or "guest"]

        now = datetime.now(UTC)
        if session.expires_at <= now:
            return None
        tokens = self._sessions.issue(session, roles, now)
        await self._repository.rotate(
            token_hash, self._tokens.hash_refresh(tokens.refresh_token), now
        )
        await self._repository.commit()
        return tokens
