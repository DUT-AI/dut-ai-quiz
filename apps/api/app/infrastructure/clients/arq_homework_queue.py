from uuid import UUID

from arq.connections import ArqRedis
from redis.asyncio import Redis
from redis.exceptions import RedisError

from app.config import settings
from app.domain.exceptions.exceptions import HomeworkWorkerUnavailableException
from app.domain.interfaces.homework_queue import IHomeworkEvaluationQueue


class ArqHomeworkEvaluationQueue(IHomeworkEvaluationQueue):
    def __init__(self, redis: Redis) -> None:
        self._redis = redis
        self._arq_redis = ArqRedis(connection_pool=redis.connection_pool)

    async def _ensure_worker_available(self) -> None:
        health_key = f"{settings.homework_queue_name}:health-check"
        try:
            worker_health = await self._redis.get(health_key)
        except RedisError as exc:
            raise HomeworkWorkerUnavailableException() from exc
        if worker_health is None:
            raise HomeworkWorkerUnavailableException()

    async def enqueue_registration(self, homework_id: UUID) -> None:
        if not settings.homework_grading_enabled:
            return
        await self._ensure_worker_available()
        try:
            await self._arq_redis.enqueue_job(
                "register_homework_job",
                homework_id=str(homework_id),
                _queue_name=settings.homework_queue_name,
                _defer_by=1,
            )
        except RedisError as exc:
            raise HomeworkWorkerUnavailableException() from exc

    async def enqueue_evaluation(self, submission_id: UUID) -> None:
        if not settings.homework_grading_enabled:
            return
        await self._ensure_worker_available()
        try:
            await self._arq_redis.enqueue_job(
                "evaluate_homework_job",
                submission_id=str(submission_id),
                _queue_name=settings.homework_queue_name,
                _defer_by=1,
            )
        except RedisError as exc:
            raise HomeworkWorkerUnavailableException() from exc
