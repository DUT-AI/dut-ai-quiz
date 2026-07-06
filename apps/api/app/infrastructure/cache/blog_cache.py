import json
from typing import Any

from loguru import logger
from redis.asyncio import Redis

from app.domain.interfaces import IBlogCache


class RedisBlogCache(IBlogCache):
    """Redis implementation of the blog cache interface with safe error handling."""

    def __init__(self, redis: Redis, ttl: int = 300) -> None:
        self._redis = redis
        self._ttl = ttl

    def _make_key(self, blog_slug: str) -> str:
        return f"blog:slug:{blog_slug}"

    async def get(self, blog_slug: str) -> dict[str, Any] | None:
        """Retrieve blog from Redis cache safely."""
        try:
            key = self._make_key(blog_slug)
            data = await self._redis.get(key)
            if data:
                return json.loads(data)
        except Exception as e:
            logger.warning(f"Error reading blog cache from Redis: {e}")
        return None

    async def set(self, blog_slug: str, blog_data: dict[str, Any]) -> None:
        """Save blog to Redis cache safely."""
        try:
            key = self._make_key(blog_slug)
            await self._redis.set(key, json.dumps(blog_data), ex=self._ttl)
        except Exception as e:
            logger.warning(f"Error writing blog cache to Redis: {e}")
