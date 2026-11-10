from datetime import UTC, datetime

from app.domain.interfaces.auth_session_repo import IAuthSessionRepository
from app.domain.interfaces.token_service import ITokenService
from app.infrastructure.cache import ProfileCache


class LogoutUseCase:
    def __init__(
        self,
        cache: ProfileCache,
        repository: IAuthSessionRepository,
        tokens: ITokenService,
    ) -> None:
        self._cache = cache
        self._repository = repository
        self._tokens = tokens

    async def execute(
        self, access_token: str | None, refresh_token: str | None = None
    ) -> None:
        if refresh_token:
            locked = await self._repository.lock_by_token(
                self._tokens.hash_refresh(refresh_token)
            )
            if locked:
                await self._repository.revoke(locked[0].id, datetime.now(UTC))
                await self._repository.commit()
        if access_token:
            # Invalidate cache on logout
            await self._cache.delete(access_token)
