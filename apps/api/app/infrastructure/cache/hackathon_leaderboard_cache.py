import json
from uuid import UUID

from redis.asyncio import Redis

from app.domain.interfaces import IHackathonLeaderboardCache


class RedisHackathonLeaderboardCache(IHackathonLeaderboardCache):
    def __init__(self, redis: Redis, ttl: int = 600) -> None:
        self._redis = redis
        self._ttl = ttl

    def _make_key(self, hackathon_id: UUID, is_private: bool = False) -> str:
        return f"hackathon_leaderboard:{hackathon_id}:{'private' if is_private else 'public'}"

    async def get(self, hackathon_id: UUID, is_private: bool = False) -> list[dict] | None:
        key = self._make_key(hackathon_id, is_private)
        data = await self._redis.get(key)
        if data:
            return json.loads(data)
        return None

    async def set(
        self, hackathon_id: UUID, leaderboard: list[dict], is_private: bool = False
    ) -> None:
        key = self._make_key(hackathon_id, is_private)
        await self._redis.set(key, json.dumps(leaderboard), ex=self._ttl)

    async def invalidate(self, hackathon_id: UUID) -> None:
        await self._redis.delete(
            self._make_key(hackathon_id, False),
            self._make_key(hackathon_id, True),
        )
