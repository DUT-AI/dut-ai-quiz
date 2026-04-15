import httpx
from pydantic import BaseModel
from typing import Any

from app.config import settings
from app.infrastructure.cache.redis_client import ProfileCache

class LoginPayload(BaseModel):
    email: str
    password: str

class AuthTokens(BaseModel):
    access_token: str
    refresh_token: str

class ProxyLoginUseCase:
    def __init__(self) -> None:
        self._url = f"{settings.manage_base_url.rstrip('/')}{settings.manage_login_path}"

    async def execute(self, payload: LoginPayload) -> AuthTokens | None:
        async with httpx.AsyncClient() as client:
            try:
                # Based on user's feedback: Manage API expects JSON with email/password
                # and returns { "is_success": true, "data": { "access_token": "...", "refresh_token": "..." } }
                response = await client.post(
                    self._url,
                    json=payload.model_dump(),
                    timeout=15.0
                )
                response.raise_for_status()
                body = response.json()
                
                if not body.get("is_success", False):
                    return None
                
                data = body.get("data")
                if not data or "access_token" not in data:
                    return None
                
                return AuthTokens(
                    access_token=data["access_token"],
                    refresh_token=data["refresh_token"]
                )
            except Exception:
                return None

class LogoutUseCase:
    def __init__(self, cache: ProfileCache) -> None:
        self._cache = cache

    async def execute(self, access_token: str | None) -> None:
        if access_token:
            # Invalidate cache on logout
            await self._cache.delete(access_token)
