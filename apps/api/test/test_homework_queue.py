from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from app.domain.exceptions.exceptions import HomeworkWorkerUnavailableException
from app.infrastructure.clients.arq_homework_queue import (
    ArqHomeworkEvaluationQueue,
)


def _queue(redis: AsyncMock, arq_redis: AsyncMock) -> ArqHomeworkEvaluationQueue:
    queue = object.__new__(ArqHomeworkEvaluationQueue)
    queue._redis = redis
    queue._arq_redis = arq_redis
    return queue


@pytest.mark.asyncio
async def test_homework_queue_rejects_redis_without_live_worker() -> None:
    redis = AsyncMock()
    redis.get.return_value = None
    arq_redis = AsyncMock()

    with pytest.raises(HomeworkWorkerUnavailableException):
        await _queue(redis, arq_redis).enqueue_evaluation(uuid4())

    arq_redis.enqueue_job.assert_not_awaited()


@pytest.mark.asyncio
async def test_homework_queue_enqueues_when_worker_is_healthy() -> None:
    redis = AsyncMock()
    redis.get.return_value = "healthy"
    arq_redis = AsyncMock()
    submission_id = uuid4()

    await _queue(redis, arq_redis).enqueue_evaluation(submission_id)

    arq_redis.enqueue_job.assert_awaited_once_with(
        "evaluate_homework_job",
        submission_id=str(submission_id),
        _queue_name="arq:homework",
        _defer_by=1,
    )
