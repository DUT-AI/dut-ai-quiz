from app.infrastructure.cache import ProfileCache


class LogoutUseCase:
    def __init__(self, cache: ProfileCache) -> None:
        self._cache = cache

    async def execute(self, access_token: str | None) -> None:
        if access_token:
            # Invalidate cache on logout
            await self._cache.delete(access_token)
