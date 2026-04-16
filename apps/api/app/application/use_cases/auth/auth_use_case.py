import httpx
from pydantic import BaseModel
from typing import Any

from app.config import settings
from app.infrastructure.cache.redis_client import ProfileCache
from loguru import logger


class LoginPayload(BaseModel):
    email: str
    password: str


class AuthTokens(BaseModel):
    access_token: str
    refresh_token: str


class ProxyLoginUseCase:
    def __init__(self) -> None:
        self._url = f"{settings.manage_base_url.rstrip('/')}/api/v1/auth/login"

    async def execute(self, payload: LoginPayload) -> AuthTokens | None:
        async with httpx.AsyncClient() as client:
            try:
                logger.info(f"Proxying login request to: {self._url}")
                response = await client.post(
                    self._url, json=payload.model_dump(), timeout=15.0
                )

                if response.status_code != 200:
                    logger.warning(
                        f"Manage API returned {response.status_code}: {response.text}"
                    )
                    return None

                body = response.json()
                logger.debug(f"Manage API response: {body}")

                if not body.get("is_success", False):
                    logger.warning(f"Login failed at Manage API: {body.get('message')}")
                    return None

                data = body.get("data")
                if not data or "access_token" not in data:
                    logger.error(f"Invalid data structure from Manage API: {data}")
                    return None

                return AuthTokens(
                    access_token=data["access_token"],
                    refresh_token=data.get("refresh_token") or "",
                )
            except Exception as e:
                logger.exception(f"Unexpected error during proxy login: {e}")
                return None


class LogoutUseCase:
    def __init__(self, cache: ProfileCache) -> None:
        self._cache = cache

    async def execute(self, access_token: str | None) -> None:
        if access_token:
            # Invalidate cache on logout
            await self._cache.delete(access_token)
