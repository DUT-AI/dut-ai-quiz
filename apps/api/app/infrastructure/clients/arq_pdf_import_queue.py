from uuid import UUID
from redis.asyncio import Redis
from arq.connections import ArqRedis

from app.domain.interfaces.pdf_import_queue import IPdfImportQueue


class ArqPdfImportQueue(IPdfImportQueue):
    """Concrete implementation of IPdfImportQueue using arq (Redis queue)."""

    def __init__(self, redis: Redis) -> None:
        self._arq_redis = ArqRedis(connection_pool=redis.connection_pool, default_queue_name='arq:pdf_queue')

    async def enqueue_parse_pdf(
        self,
        job_id: UUID,
        file_path: str,
        user_id: int,
        lesson_id: str | None,
        target_scope: str | None,
        password: str | None,
    ) -> None:
        """Enqueues the parse_pdf_job."""
        await self._arq_redis.enqueue_job(
            "parse_pdf_job",
            job_id=str(job_id),
            file_path=file_path,
            user_id=user_id,
            lesson_id=lesson_id,
            target_scope=target_scope,
            password=password,
            _job_id=f"pdf_import:{job_id}",
        )
