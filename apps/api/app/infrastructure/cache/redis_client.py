import json
from typing import Any

from redis.asyncio import Redis

class ProfileCache:
    def __init__(self, redis: Redis, ttl: int = 600) -> None:
        self._redis = redis
        self._ttl = ttl

    def _make_key(self, token: str) -> str:
        # We use a hash of the token if it's too long, but for simplicity here we prefix it.
        # In production, consider hashing the token to avoid storing raw tokens in Redis keys if they are sensitive.
        import hashlib
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        return f"auth:profile:{token_hash}"

    async def get(self, token: str) -> dict[str, Any] | None:
        key = self._make_key(token)
        data = await self._redis.get(key)
        if data:
            return json.loads(data)
        return None

    async def set(self, token: str, profile: dict[str, Any]) -> None:
        key = self._make_key(token)
        await self._redis.set(key, json.dumps(profile), ex=self._ttl)

    async def delete(self, token: str) -> None:
        key = self._make_key(token)
        await self._redis.delete(key)
