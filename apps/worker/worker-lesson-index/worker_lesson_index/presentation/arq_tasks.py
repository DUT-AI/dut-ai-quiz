from urllib.parse import urlparse
from uuid import UUID

import httpx
from arq import Retry
from arq.connections import RedisSettings
from loguru import logger
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


async def startup(ctx):
    logger.info("Starting lesson indexing worker...")
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


async def shutdown(ctx):
    http_client = ctx.get("http_client")
    if http_client:
        await http_client.aclose()
    logger.info("Lesson indexing worker stopped")


async def index_lesson_job(ctx, lesson_id: str, expected_source_hash: str):
    lesson_uuid = UUID(lesson_id)
    async with AsyncSessionLocal() as session:
        await session.execute(
            select(func.pg_advisory_xact_lock(func.hashtext(str(lesson_uuid))))
        )
        lesson_repo = LessonRepository(session)
        lesson = await lesson_repo.get(lesson_uuid)
        if lesson is None:
            raise Retry(defer=2)

        current_hash = lesson_source_hash(
            lesson.name, lesson.description, lesson.content_md or ""
        )
        if current_hash != expected_source_hash:
            if ctx.get("job_try", 1) < 3:
                raise Retry(defer=2)
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
    functions = [index_lesson_job]
    redis_settings = _redis_settings_from_config()
    queue_name = settings.lesson_index_queue_name
    on_startup = startup
    on_shutdown = shutdown
