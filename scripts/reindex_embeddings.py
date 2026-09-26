#!/usr/bin/env python3
"""CLI utility to re-embed all lessons and questions in the database.

Usage:
    # Reindex both lessons and questions synchronously (direct):
    uv run python scripts/reindex_embeddings.py

    # Reindex only lessons:
    uv run python scripts/reindex_embeddings.py --lessons

    # Reindex only questions:
    uv run python scripts/reindex_embeddings.py --questions

    # Enqueue lessons to background Redis worker queue:
    uv run python scripts/reindex_embeddings.py --lessons --queue
"""

import argparse
import asyncio
import sys
from pathlib import Path

# Ensure apps/api is in python path
ROOT_DIR = Path(__file__).resolve().parents[1]
API_DIR = ROOT_DIR / "apps" / "api"
if str(API_DIR) not in sys.path:
    sys.path.insert(0, str(API_DIR))

import httpx
from app.application.services.lesson_chunker import LessonChunker
from app.application.services.lesson_embedding_indexer import LessonEmbeddingIndexer
from app.application.services.lesson_index_scheduler import LessonIndexScheduler
from app.application.services.question_embedding import QuestionEmbeddingService
from app.config import settings
from app.infrastructure.clients.arq_lesson_index_queue import ArqLessonIndexQueue
from app.infrastructure.clients.embedding_service import (
    DutAiEmbeddingService,
    LocalHashingEmbeddingService,
    OpenAICompatibleEmbeddingService,
)
from app.infrastructure.database import AsyncSessionLocal
from app.infrastructure.persistence.models import Question
from app.infrastructure.repositories.lesson_chunks import LessonChunkRepository
from app.infrastructure.repositories.lessons import LessonRepository
from app.infrastructure.repositories.questions import QuestionRepository
from loguru import logger
from redis.asyncio import from_url
from sqlalchemy import select


def get_embedding_service(client: httpx.AsyncClient):
    if settings.embedding_provider.casefold() == "local":
        return LocalHashingEmbeddingService(settings)
    if settings.embedding_provider.casefold() == "dutai":
        return DutAiEmbeddingService(client, settings)
    return OpenAICompatibleEmbeddingService(client, settings)


async def reindex_lessons_sync(client: httpx.AsyncClient):
    logger.info("=== Starting Synchronous Reindexing of Lessons ===")
    embedding_service = get_embedding_service(client)
    chunker = LessonChunker(
        target_tokens=settings.lesson_chunk_target_tokens,
        max_tokens=settings.lesson_chunk_max_tokens,
    )

    async with AsyncSessionLocal() as session:
        lesson_repo = LessonRepository(session)
        chunk_repo = LessonChunkRepository(session)
        indexer = LessonEmbeddingIndexer(chunk_repo, embedding_service, chunker)

        lessons = await lesson_repo.list_all()
        logger.info("Found {} total lessons in database", len(lessons))

        total_chunks = 0
        success_count = 0
        for i, lesson in enumerate(lessons, 1):
            if not lesson.content_md or not lesson.content_md.strip():
                logger.info("[{}/{}] Skipping lesson '{}' (empty content)", i, len(lessons), lesson.name)
                continue

            try:
                count = await indexer.index(lesson)
                await session.commit()
                total_chunks += count
                success_count += 1
                logger.info(
                    "[{}/{}] Indexed '{}' (ID: {}) -> {} chunks",
                    i,
                    len(lessons),
                    lesson.name,
                    lesson.id,
                    count,
                )
            except Exception as exc:
                await session.rollback()
                logger.error("Failed to index lesson '{}' (ID: {}): {}", lesson.name, lesson.id, exc)

        logger.info(
            "=== Finished Lessons Reindexing: {}/{} lessons indexed, {} total chunks created ===",
            success_count,
            len(lessons),
            total_chunks,
        )


async def reindex_lessons_queue(client: httpx.AsyncClient):
    logger.info("=== Enqueuing Lessons to Redis Worker Queue ===")
    redis_client = from_url(settings.redis_url)
    queue = ArqLessonIndexQueue(redis_client)
    embedding_service = get_embedding_service(client)
    scheduler = LessonIndexScheduler(queue, embedding_service)

    async with AsyncSessionLocal() as session:
        lesson_repo = LessonRepository(session)
        lessons = await lesson_repo.list_all()
        logger.info("Found {} total lessons in database", len(lessons))

        enqueued_count = 0
        for i, lesson in enumerate(lessons, 1):
            if not lesson.content_md or not lesson.content_md.strip():
                continue
            ok = await scheduler.schedule(lesson)
            if ok:
                enqueued_count += 1
                logger.info("[{}/{}] Enqueued '{}' (ID: {})", i, len(lessons), lesson.name, lesson.id)
            else:
                logger.warning("[{}/{}] Failed to enqueue '{}'", i, len(lessons), lesson.name)

        await redis_client.aclose()
        logger.info("=== Enqueued {}/{} lessons to queue: {} ===", enqueued_count, len(lessons), settings.lesson_index_queue_name)


async def reindex_questions(client: httpx.AsyncClient, force_all: bool = False):
    logger.info("=== Starting Reindexing of Questions ===")
    embedding_service = get_embedding_service(client)
    question_embedding_svc = QuestionEmbeddingService(embedding_service)

    async with AsyncSessionLocal() as session:
        # Find questions needing reindexing
        if force_all:
            stmt = select(Question)
        else:
            stmt = select(Question).where(
                (Question.embedding.is_(None)) | (Question.embedding_model != embedding_service.model_name)
            )

        rows = (await session.execute(stmt)).scalars().all()
        logger.info("Found {} questions needing embeddings (model: {})", len(rows), embedding_service.model_name)

        if not rows:
            logger.info("All questions already have current embeddings.")
            return

        batch_size = max(1, settings.embedding_batch_size)
        total = len(rows)

        for offset in range(0, total, batch_size):
            batch_models = rows[offset : offset + batch_size]
            batch_entities = [m.to_entity() for m in batch_models]

            try:
                await question_embedding_svc.prepare_many(batch_entities)
                for model, entity in zip(batch_models, batch_entities, strict=True):
                    model.embedding = entity.embedding
                    model.embedding_model = entity.embedding_model
                    model.embedding_source_hash = entity.embedding_source_hash

                await session.commit()
                logger.info(
                    "Embedded questions {}-{} of {} ({:.1f}%)",
                    offset + 1,
                    min(offset + batch_size, total),
                    total,
                    min(offset + batch_size, total) / total * 100,
                )
            except Exception as exc:
                await session.rollback()
                logger.error("Error embedding question batch {}-{}: {}", offset, offset + batch_size, exc)

        logger.info("=== Finished Questions Reindexing ===")


async def main():
    parser = argparse.ArgumentParser(description="Re-embed lessons and questions with current embedding provider.")
    parser.add_argument("--lessons", action="store_true", help="Reindex all lessons")
    parser.add_argument("--questions", action="store_true", help="Reindex all questions")
    parser.add_argument("--all", action="store_true", help="Reindex both lessons and questions (default)")
    parser.add_argument(
        "--queue",
        action="store_true",
        help="Enqueue lesson indexing jobs to background Redis worker rather than running synchronously",
    )
    parser.add_argument(
        "--force-questions",
        action="store_true",
        help="Force re-embedding of questions even if they already have an embedding",
    )
    args = parser.parse_args()

    do_lessons = args.lessons or args.all or (not args.lessons and not args.questions)
    do_questions = args.questions or args.all or (not args.lessons and not args.questions)

    logger.info("Embedding Provider: {}", settings.embedding_provider)
    logger.info("Embedding Model:    {}", settings.embedding_model)
    logger.info("Embedding Endpoint: {}", settings.embedding_api_url)
    logger.info("Dimensions:         {}", settings.embedding_dimensions)

    async with httpx.AsyncClient() as http_client:
        if do_lessons:
            if args.queue:
                await reindex_lessons_queue(http_client)
            else:
                await reindex_lessons_sync(http_client)

        if do_questions:
            await reindex_questions(http_client, force_all=args.force_questions)


if __name__ == "__main__":
    asyncio.run(main())
