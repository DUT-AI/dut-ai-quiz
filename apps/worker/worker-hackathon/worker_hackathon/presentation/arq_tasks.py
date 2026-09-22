import os
from urllib.parse import urlparse

from app.config import settings
from arq import cron
from arq.connections import RedisSettings
from loguru import logger
from redis.asyncio import from_url

from worker_hackathon.application.use_cases.evaluate_submission import (
    EvaluateSubmissionUseCase,
)
from worker_hackathon.infrastructure.adapters import (
    CsvEvaluator,
    DockerSandbox,
    MinioArtifactStore,
    PostgresSubmissionRepository,
    RedisCancellationToken,
    RedisSubmissionEventPublisher,
)


async def startup(ctx):
    logger.info("Starting hackathon worker...")
    redis = from_url(_redis_url_from_settings(), decode_responses=True)
    redis_settings = _redis_settings_from_config()
    logger.info(
        "Worker queue target: Redis {}:{} database {}",
        redis_settings.host,
        redis_settings.port,
        redis_settings.database,
    )

    sandbox = DockerSandbox(
        image_name=settings.sandbox_image_name,
        log_tail_lines=settings.log_max_lines,
    )
    evaluator = CsvEvaluator()
    artifact_store = MinioArtifactStore()
    submission_repo = PostgresSubmissionRepository()
    cancellation = RedisCancellationToken(redis)
    event_publisher = RedisSubmissionEventPublisher(redis)

    ctx["redis"] = redis
    evaluate_use_case = EvaluateSubmissionUseCase(
        sandbox=sandbox,
        evaluator=evaluator,
        artifact_store=artifact_store,
        submission_repo=submission_repo,
        cancellation=cancellation,
        event_publisher=event_publisher,
        sandbox_timeout_seconds=settings.sandbox_timeout_seconds,
        sandbox_mem_limit=settings.sandbox_mem_limit,
        sandbox_cpu_limit=settings.sandbox_cpu_limit,
        log_max_lines=settings.log_max_lines,
        sandbox_workspace_root=os.getenv("WORKER_SANDBOX_ROOT"),
    )
    ctx["evaluate_use_case"] = evaluate_use_case
    logger.info("Clean Architecture components successfully initialized.")
    recovered = await evaluate_use_case.recover_stale_extracting_submissions(stale_seconds=300)
    if recovered:
        logger.info("Recovered {} stale extracting submissions on startup.", recovered)


async def shutdown(ctx):
    logger.info("Shutting down hackathon worker...")
    redis = ctx.get("redis")
    if redis:
        await redis.aclose()


async def evaluate_submission_job(
    ctx,
    submission_id: str,
):
    logger.info(f"Received submission job event for ID: {submission_id}")
    use_case: EvaluateSubmissionUseCase = ctx["evaluate_use_case"]

    try:
        score = await use_case.execute(
            submission_id=submission_id,
        )
        if score is None:
            logger.info(f"Job finished without score for Submission {submission_id}")
        else:
            logger.info(f"Job completed successfully. Submission {submission_id} scored: {score}")
        return score
    except Exception as e:
        logger.error(f"Job failed for Submission {submission_id}: {e}")
        raise


async def sweep_stale_submissions_job(ctx):
    use_case: EvaluateSubmissionUseCase = ctx["evaluate_use_case"]
    recovered = await use_case.recover_stale_extracting_submissions(stale_seconds=300)
    failed = await use_case.sweep_stale_submissions(
        uploading_timeout_seconds=settings.presigned_url_expire_seconds + 300,
        processing_timeout_seconds=settings.sandbox_timeout_seconds + 300,
    )
    return recovered + failed


def _redis_url_from_settings() -> str:
    return settings.redis_url


def _redis_settings_from_config() -> RedisSettings:
    parsed = urlparse(_redis_url_from_settings())
    database = int(parsed.path.lstrip("/") or 0)
    return RedisSettings(
        host=parsed.hostname or "127.0.0.1",
        port=parsed.port or 6379,
        database=database,
        username=parsed.username,
        password=parsed.password,
        ssl=parsed.scheme in {"rediss", "redis+ssl"},
    )


class WorkerSettings:
    functions = [evaluate_submission_job]
    cron_jobs = [
        cron(
            sweep_stale_submissions_job,
            minute={0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55},
        )
    ]
    redis_settings = _redis_settings_from_config()
    queue_name = settings.hackathon_queue_name
    on_startup = startup
    on_shutdown = shutdown
