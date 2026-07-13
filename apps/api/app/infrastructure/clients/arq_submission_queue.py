from uuid import UUID
from redis.asyncio import Redis
from arq.connections import ArqRedis

from app.domain.interfaces.submission_queue import ISubmissionQueue


class ArqSubmissionQueue(ISubmissionQueue):
    """Concrete implementation of ISubmissionQueue using arq (Redis queue)."""

    def __init__(self, redis: Redis) -> None:
        self._arq_redis = ArqRedis(connection_pool=redis.connection_pool)

    async def enqueue_evaluation(
        self,
        submission_id: UUID,
    ) -> None:
        """Enqueues the evaluate submission job reusing the injected Redis connection pool."""
        await self._arq_redis.enqueue_job(
            "evaluate_submission_job",
            submission_id=str(submission_id),
        )
