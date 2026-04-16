from typing import Any
import httpx

from app.application.services.auth_roles import quiz_role_from_manage
from app.config import settings
from app.infrastructure.cache.redis_client import ProfileCache


class GetProfileUseCase:
    def __init__(self, cache: ProfileCache) -> None:
        self._cache = cache
        self._url = f"{settings.manage_base_url.rstrip('/')}/api/v1/auth/me"

    async def execute(self, access_token: str | None) -> dict[str, Any] | None:
        if not access_token:
            return None

        # 1. Check Cache
        cached = await self._cache.get(access_token)
        if cached:
            return cached

        # 2. Fetch from Manage API if not in cache
        async with httpx.AsyncClient() as client:
            try:
                headers = {"Authorization": f"Bearer {access_token}"}
                response = await client.get(self._url, headers=headers, timeout=15.0)
                response.raise_for_status()
                body = response.json()

                if not body.get("is_success", True):
                    return None

                data = body.get("data")
                if data is None:
                    return None

                # Map role
                rn = str(data.get("role_name") or "")
                try:
                    data["quiz_role"] = quiz_role_from_manage(rn)
                except ValueError:
                    data["quiz_role"] = "guest"

                # 3. Store in Cache
                await self._cache.set(access_token, data)
                return data
            except Exception:
                return None
