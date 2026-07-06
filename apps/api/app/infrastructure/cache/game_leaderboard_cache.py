import json

from redis.asyncio import Redis

class GameLeaderboardCache:
    def __init__(self, redis: Redis, ttl: int = 600) -> None:
        self._redis = redis
        self._ttl = ttl

    def _make_key(self, lesson_slug: str) -> str:
        return f"game_leaderboard:{lesson_slug}"

    async def get(self, lesson_slug: str) -> list[dict] | None:
        key = self._make_key(lesson_slug)
        data = await self._redis.get(key)
        if data:
            return json.loads(data)
        return None

    async def set(self, lesson_slug: str, leaderboard: list[dict]) -> None:
        key = self._make_key(lesson_slug)
        await self._redis.set(key, json.dumps(leaderboard), ex=self._ttl)

    async def invalidate(self, lesson_slug: str) -> None:
        key = self._make_key(lesson_slug)
        await self._redis.delete(key)
