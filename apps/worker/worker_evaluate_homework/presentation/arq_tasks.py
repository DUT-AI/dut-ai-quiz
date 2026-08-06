
from typing import ClassVar
from urllib.parse import urlparse
from uuid import UUID

import httpx
from app.config import settings
from app.infrastructure.clients.minio_client import MinioClient
from arq import Retry
from arq.connections import RedisSettings
from loguru import logger

from worker_evaluate_homework.application.use_cases import (
    EvaluateHomeworkSubmissionUseCase,
    RegisterHomeworkUseCase,
)
from worker_evaluate_homework.domain import InvalidArtifactError
from worker_evaluate_homework.infrastructure import (
    GeminiHomeworkGradingEngine,
    PostgresHomeworkGradingRepository,
    S3HomeworkArtifactReader,
)


async def startup(ctx):
    logger.info("Starting homework evaluation worker...")
    http_client = httpx.AsyncClient()
    repository = PostgresHomeworkGradingRepository()
    artifact_reader = S3HomeworkArtifactReader(
        http_client,
        MinioClient(),
    )
    grading_engine = GeminiHomeworkGradingEngine()
    register_use_case = RegisterHomeworkUseCase(
        repository,
        artifact_reader,
        grading_engine,
    )
    ctx["http_client"] = http_client
    ctx["register_use_case"] = register_use_case
    ctx["evaluate_use_case"] = EvaluateHomeworkSubmissionUseCase(
        repository,
        artifact_reader,
        grading_engine,
        register_use_case,
        settings.homework_plagiarism_threshold,
    )


async def shutdown(ctx):
    http_client = ctx.get("http_client")
    if http_client:
        await http_client.aclose()
    logger.info("Homework evaluation worker stopped")


async def register_homework_job(ctx, homework_id: str):
    use_case: RegisterHomeworkUseCase = ctx["register_use_case"]
    job_try = int(ctx.get("job_try", 1))
    try:
        await use_case.execute(UUID(homework_id))
    except InvalidArtifactError as exc:
        logger.warning("Homework registration {} rejected: {}", homework_id, exc)
        return
    except Exception as exc:
        logger.exception("Homework registration {} failed", homework_id)
        if job_try < 3:
            raise Retry(defer=10 * job_try) from exc
        raise


async def evaluate_homework_job(ctx, submission_id: str):
    use_case: EvaluateHomeworkSubmissionUseCase = ctx["evaluate_use_case"]
    job_try = int(ctx.get("job_try", 1))
    try:
        return await use_case.execute(
            UUID(submission_id),
            final_attempt=job_try >= 3,
        )
    except InvalidArtifactError as exc:
        logger.warning("Homework evaluation {} rejected: {}", submission_id, exc)
        return None
    except Exception as exc:
        logger.exception("Homework evaluation {} failed", submission_id)
        if job_try < 3:
            raise Retry(defer=10 * job_try) from exc
        raise


def _redis_settings_from_config() -> RedisSettings:
    parsed = urlparse(settings.redis_url)
    return RedisSettings(
        host=parsed.hostname or "127.0.0.1",
        port=parsed.port or 6379,
        database=int(parsed.path.lstrip("/") or 0),
        username=parsed.username,
        password=parsed.password,
        ssl=parsed.scheme in {"rediss", "redis+ssl"},
    )


class WorkerSettings:
    functions: ClassVar[list] = [register_homework_job, evaluate_homework_job]
    redis_settings = _redis_settings_from_config()
    queue_name = settings.homework_queue_name
    max_tries = 3
    max_jobs = 1
    job_timeout = int(settings.homework_grading_timeout_seconds) + 60
    health_check_interval = 15
    on_startup = startup
    on_shutdown = shutdown
