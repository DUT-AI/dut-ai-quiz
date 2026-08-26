from worker_pdf_import.process_pdf_import_uc import ProcessPdfImportUseCase
from worker_pdf_import.service.ai_pdf_parser import AIPdfParserStrategy
from urllib.parse import urlparse
from uuid import UUID

import httpx
from arq.connections import RedisSettings
from loguru import logger
from redis.asyncio import from_url

from app.config import settings
from app.infrastructure.database import AsyncSessionLocal
from app.infrastructure.repositories.import_sessions import ImportSessionRepository
from app.infrastructure.repositories.questions import QuestionRepository



async def startup(ctx):
    logger.info("Starting up PDF worker entrypoint (Presentation layer)...")
    redis = from_url(settings.redis_url, decode_responses=True)
    redis_settings = _redis_settings_from_config()
    logger.info(
        "Worker queue target: Redis {}:{} database {}",
        redis_settings.host,
        redis_settings.port,
        redis_settings.database,
    )

    ctx["redis"] = redis
    http_client = httpx.AsyncClient()
    ctx["http_client"] = http_client

    # PDF Import
    async_session = AsyncSessionLocal()
    import_session_repo = ImportSessionRepository(async_session)
    question_repo = QuestionRepository(async_session)
    pdf_parser = AIPdfParserStrategy()
    process_pdf_uc = ProcessPdfImportUseCase(
        import_session_repo, question_repo, pdf_parser
    )
    ctx["process_pdf_import_use_case"] = process_pdf_uc
    ctx["async_session"] = async_session

    logger.info("PDF Worker components successfully initialized.")


async def shutdown(ctx):
    logger.info("Shutting down PDF worker entrypoint...")
    redis = ctx.get("redis")
    if redis:
        await redis.aclose()
    http_client = ctx.get("http_client")
    if http_client:
        await http_client.aclose()

    async_session = ctx.get("async_session")
    if async_session:
        await async_session.close()


async def parse_pdf_job(
    ctx,
    job_id: str,
    file_path: str,
    user_id: int,
    lesson_id: str | None,
    target_scope: str | None,
    password: str | None,
):
    logger.info(f"Received PDF import job: {job_id}")

    async with AsyncSessionLocal() as session:
        import_session_repo = ImportSessionRepository(session)
        question_repo = QuestionRepository(session)
        pdf_parser = AIPdfParserStrategy()
        use_case = ProcessPdfImportUseCase(
            import_session_repo, question_repo, pdf_parser
        )

        try:
            await use_case.execute(
                job_id=UUID(job_id),
                file_path=file_path,
                user_id=user_id,
                lesson_id=lesson_id,
                target_scope=target_scope,
                password=password,
            )
            await session.commit()
            logger.info(f"PDF import job {job_id} completed and committed to DB.")
        except Exception as e:
            await session.rollback()
            logger.error(f"PDF import job {job_id} failed: {e}")
            raise


def _redis_settings_from_config() -> RedisSettings:
    parsed = urlparse(settings.redis_url)
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
    functions = [parse_pdf_job]
    queue_name = "arq:pdf_queue"
    redis_settings = _redis_settings_from_config()
    on_startup = startup
    on_shutdown = shutdown
