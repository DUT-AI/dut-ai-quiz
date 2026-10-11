from uuid import UUID

from arq.connections import ArqRedis


class ArqHomeworkGradingQueue:
    def __init__(self, redis: ArqRedis, queue_name: str) -> None:
        self._redis = redis
        self._queue_name = queue_name

    async def enqueue_registration(self, homework_id: UUID) -> bool:
        job = await self._redis.enqueue_job(
            "register_homework_job",
            homework_id=str(homework_id),
            _queue_name=self._queue_name,
            _job_id=f"homework-register:{homework_id}",
            _defer_by=1,
        )
        return job is not None

    async def enqueue_evaluation(self, submission_id: UUID) -> bool:
        job = await self._redis.enqueue_job(
            "evaluate_homework_job",
            submission_id=str(submission_id),
            _queue_name=self._queue_name,
            _job_id=f"homework-evaluate:{submission_id}",
            _defer_by=1,
        )
        return job is not None
