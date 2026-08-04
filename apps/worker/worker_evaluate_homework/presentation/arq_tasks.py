from urllib.parse import urlparse
from uuid import UUID

import httpx
from arq.connections import RedisSettings
from loguru import logger

from app.config import settings
from app.infrastructure.clients.minio_client import MinioClient
from worker_evaluate_homework.application.use_cases import EvaluateHomeworkUseCase


async def startup(ctx):
    logger.info("Starting homework evaluation worker...")
    http_client = httpx.AsyncClient()
    ctx["http_client"] = http_client
    ctx["use_case"] = EvaluateHomeworkUseCase(http_client, MinioClient())


async def shutdown(ctx):
    http_client = ctx.get("http_client")
    if http_client:
        await http_client.aclose()
    logger.info("Homework evaluation worker stopped")


async def register_homework_job(ctx, homework_id: str):
    use_case: EvaluateHomeworkUseCase = ctx["use_case"]
    await use_case.register_homework(
        UUID(homework_id), job_try=int(ctx.get("job_try", 1))
    )


async def evaluate_homework_job(ctx, submission_id: str):
    use_case: EvaluateHomeworkUseCase = ctx["use_case"]
    return await use_case.evaluate(
        UUID(submission_id), job_try=int(ctx.get("job_try", 1))
    )


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
    functions = [register_homework_job, evaluate_homework_job]
    redis_settings = _redis_settings_from_config()
    queue_name = settings.homework_queue_name
    max_tries = 3
    on_startup = startup
    on_shutdown = shutdown
