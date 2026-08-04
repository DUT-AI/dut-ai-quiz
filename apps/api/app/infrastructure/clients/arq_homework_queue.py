from uuid import UUID

from arq.connections import ArqRedis
from redis.asyncio import Redis

from app.config import settings
from app.domain.interfaces.homework_queue import IHomeworkEvaluationQueue


class ArqHomeworkEvaluationQueue(IHomeworkEvaluationQueue):
    def __init__(self, redis: Redis) -> None:
        self._arq_redis = ArqRedis(connection_pool=redis.connection_pool)

    async def enqueue_registration(self, homework_id: UUID) -> None:
        if not settings.homework_checker_api_url:
            return
        await self._arq_redis.enqueue_job(
            "register_homework_job",
            homework_id=str(homework_id),
            _job_id=f"homework-register:{homework_id}",
            _queue_name=settings.homework_queue_name,
            _defer_by=1,
        )

    async def enqueue_evaluation(self, submission_id: UUID) -> None:
        if not settings.submission_checker_api_url:
            return
        await self._arq_redis.enqueue_job(
            "evaluate_homework_job",
            submission_id=str(submission_id),
            _job_id=f"homework-evaluate:{submission_id}",
            _queue_name=settings.homework_queue_name,
            _defer_by=1,
        )
