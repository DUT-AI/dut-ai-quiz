from uuid import UUID

from arq.connections import ArqRedis
from redis.asyncio import Redis

from app.domain.interfaces import ILessonIndexQueue


class ArqLessonIndexQueue(ILessonIndexQueue):
    def __init__(self, redis: Redis) -> None:
        self._arq_redis = ArqRedis(connection_pool=redis.connection_pool)

    async def enqueue_index(self, lesson_id: UUID, source_hash: str) -> None:
        await self._arq_redis.enqueue_job(
            "index_lesson_job",
            lesson_id=str(lesson_id),
            expected_source_hash=source_hash,
            _job_id=f"lesson-index:{lesson_id}:{source_hash}",
            _defer_by=1,
        )
