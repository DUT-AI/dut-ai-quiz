import json
from datetime import datetime
from typing import Any

from redis.asyncio import Redis

from app.application.dtos import GameLeaderboardRowDTO


def _json_serializer(obj: Any) -> str:
    if isinstance(obj, datetime):
        return obj.isoformat()
    return str(obj)


class GameLeaderboardCache:
    def __init__(self, redis: Redis, ttl: int = 600) -> None:
        self._redis = redis
        self._ttl = ttl

    def _make_key(self, lesson_slug: str) -> str:
        return f"game_leaderboard:{lesson_slug}"

    async def get(self, lesson_slug: str) -> list[GameLeaderboardRowDTO] | None:
        key = self._make_key(lesson_slug)
        data = await self._redis.get(key)
        if data:
            raw_list = json.loads(data)
            return [GameLeaderboardRowDTO.model_validate(item) for item in raw_list]
        return None

    async def set(self, lesson_slug: str, leaderboard: list[GameLeaderboardRowDTO]) -> None:
        key = self._make_key(lesson_slug)
        payload = [row.model_dump(mode="json") for row in leaderboard]
        await self._redis.set(
            key, json.dumps(payload, default=_json_serializer), ex=self._ttl
        )

    async def invalidate(self, lesson_slug: str) -> None:
        key = self._make_key(lesson_slug)
        await self._redis.delete(key)

