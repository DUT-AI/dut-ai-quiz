import os
from urllib.parse import urlparse
from uuid import UUID

import httpx
from arq import Retry, cron
from arq.connections import RedisSettings
from loguru import logger
from redis.asyncio import from_url
from sqlalchemy import func, select

from app.application.services.lesson_chunker import LessonChunker
from app.application.services.lesson_embedding_indexer import LessonEmbeddingIndexer
from app.config import settings
from app.domain.entities.lesson_chunk import lesson_source_hash
from app.infrastructure.clients.embedding_service import (
    DutAiEmbeddingService,
    LocalHashingEmbeddingService,
    OpenAICompatibleEmbeddingService,
)
from app.infrastructure.database import AsyncSessionLocal
from app.infrastructure.repositories.lesson_chunks import LessonChunkRepository
from app.infrastructure.repositories.lessons import LessonRepository
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
    http_client = httpx.AsyncClient()
    ctx["http_client"] = http_client
    if settings.embedding_provider.casefold() == "local":
        ctx["embedding_service"] = LocalHashingEmbeddingService(settings)
    elif settings.embedding_provider.casefold() == "dutai":
        ctx["embedding_service"] = DutAiEmbeddingService(http_client, settings)
    else:
        ctx["embedding_service"] = OpenAICompatibleEmbeddingService(
            http_client, settings
        )
    ctx["lesson_chunker"] = LessonChunker(
        target_tokens=settings.lesson_chunk_target_tokens,
        max_tokens=settings.lesson_chunk_max_tokens,
    )
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
    recovered = await evaluate_use_case.recover_stale_extracting_submissions(
        stale_seconds=300
    )
    if recovered:
        logger.info("Recovered {} stale extracting submissions on startup.", recovered)


async def shutdown(ctx):
    logger.info("Shutting down worker entrypoint...")
    redis = ctx.get("redis")
    if redis:
        await redis.aclose()
    http_client = ctx.get("http_client")
    if http_client:
        await http_client.aclose()


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
            logger.info(
                f"Job completed successfully. Submission {submission_id} scored: {score}"
            )
        return score
    except Exception as e:
        logger.error(f"Job failed for Submission {submission_id}: {e}")
        raise


async def index_lesson_job(
    ctx,
    lesson_id: str,
    expected_source_hash: str,
):
    lesson_uuid = UUID(lesson_id)
    async with AsyncSessionLocal() as session:
        # Serialize jobs for one lesson. Multiple rapid edits may enqueue several
        # versions, but each job indexes the newest committed source safely.
        await session.execute(
            select(func.pg_advisory_xact_lock(func.hashtext(str(lesson_uuid))))
        )
        lesson_repo = LessonRepository(session)
        lesson = await lesson_repo.get(lesson_uuid)
        if lesson is None:
            # The API enqueues just before its transaction commits. A short retry
            # closes that race without making the HTTP request wait for indexing.
            raise Retry(defer=2)

        current_hash = lesson_source_hash(
            lesson.name, lesson.description, lesson.content_md or ""
        )
        if current_hash != expected_source_hash:
            if ctx.get("job_try", 1) < 3:
                # Most commonly the API transaction has not committed yet.
                raise Retry(defer=2)
            # A newer edit has superseded this version and has its own versioned
            # job id, so this stale job must not overwrite the newer index.
            logger.info(
                "Skipping stale lesson index job {} (current source is {})",
                expected_source_hash,
                current_hash,
            )
            return 0

        indexer = LessonEmbeddingIndexer(
            LessonChunkRepository(session),
            ctx["embedding_service"],
            ctx["lesson_chunker"],
        )
        count = await indexer.index(lesson)
        await session.commit()
        logger.info("Indexed {} chunks for lesson {}", count, lesson_uuid)
        return count


async def sweep_stale_submissions_job(ctx):
    use_case: EvaluateSubmissionUseCase = ctx["evaluate_use_case"]
    recovered = await use_case.recover_stale_extracting_submissions(
        stale_seconds=300
    )
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
    functions = [evaluate_submission_job, index_lesson_job]
    cron_jobs = [
        cron(
            sweep_stale_submissions_job,
            minute={0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55},
        )
    ]
    redis_settings = _redis_settings_from_config()
    on_startup = startup
    on_shutdown = shutdown
