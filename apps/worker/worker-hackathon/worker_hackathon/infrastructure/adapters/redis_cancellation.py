from uuid import UUID

from redis.asyncio import Redis

from worker_hackathon.domain.interfaces.cancellation import ICancellationToken


class RedisCancellationToken(ICancellationToken):
    def __init__(self, redis: Redis) -> None:
        self._redis = redis

    async def is_cancelled(self, submission_id: UUID) -> bool:
        return bool(await self._redis.exists(f"cancel:{submission_id}"))
