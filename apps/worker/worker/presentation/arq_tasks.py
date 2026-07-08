import os
from urllib.parse import urlparse

from arq.connections import RedisSettings
from loguru import logger
from redis.asyncio import from_url

from app.config import settings
from worker.application.use_cases.evaluate_submission import EvaluateSubmissionUseCase
from worker.infrastructure.adapters import (
    CsvEvaluator,
    DockerSandbox,
    MinioArtifactStore,
    PostgresSubmissionRepository,
    RedisCancellationToken,
    RedisSubmissionEventPublisher,
)


async def startup(ctx):
    logger.info("Starting up worker entrypoint (Presentation layer)...")
    redis = from_url(_redis_url_from_settings(), decode_responses=True)

    sandbox = DockerSandbox(image_name=settings.sandbox_image_name)
    evaluator = CsvEvaluator()
    artifact_store = MinioArtifactStore()
    submission_repo = PostgresSubmissionRepository()
    cancellation = RedisCancellationToken(redis)
    event_publisher = RedisSubmissionEventPublisher(redis)

    ctx["redis"] = redis
    ctx["evaluate_use_case"] = EvaluateSubmissionUseCase(
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
    logger.info("Clean Architecture components successfully initialized.")


async def shutdown(ctx):
    logger.info("Shutting down worker entrypoint...")
    redis = ctx.get("redis")
    if redis:
        await redis.aclose()


async def evaluate_submission_job(
    ctx,
    submission_id: str,
    script_s3_key: str,
    ground_truth_s3_key: str,
    metric_type: str,
):
    logger.info(f"Received submission job event for ID: {submission_id}")
    use_case: EvaluateSubmissionUseCase = ctx["evaluate_use_case"]

    try:
        score = await use_case.execute(
            submission_id=submission_id,
            script_s3_key=script_s3_key,
            ground_truth_s3_key=ground_truth_s3_key,
            metric_type=metric_type,
        )
        if score is None:
            logger.info(f"Job finished without score for Submission {submission_id}")
        else:
            logger.info(
                f"Job completed successfully. Submission {submission_id} scored: {score}"
            )
        return score
    except Exception as e:
        logger.error(f"Job failed for Submission {submission_id}: {e}")
        raise


def _redis_url_from_settings() -> str:
    redis_host = str(settings.redis_host)
    if redis_host.startswith(("redis://", "rediss://")):
        return redis_host
    return f"redis://{redis_host}:{settings.redis_port}/0"


def _redis_settings_from_config() -> RedisSettings:
    parsed = urlparse(_redis_url_from_settings())
    database = int(parsed.path.lstrip("/") or 0)
    return RedisSettings(
        host=parsed.hostname or str(settings.redis_host),
        port=parsed.port or settings.redis_port,
        database=database,
    )


class WorkerSettings:
    functions = [evaluate_submission_job]
    redis_settings = _redis_settings_from_config()
    on_startup = startup
    on_shutdown = shutdown
