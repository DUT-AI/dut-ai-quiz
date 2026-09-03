from uuid import UUID
from redis.asyncio import Redis
from arq.connections import ArqRedis
import hashlib
from app.domain.interfaces.pdf_import_queue import IPdfImportQueue


class ArqPdfImportQueue(IPdfImportQueue):
    """Concrete implementation of IPdfImportQueue using arq (Redis queue)."""

    def __init__(self, redis: Redis) -> None:
        self._arq_redis = ArqRedis(
            connection_pool=redis.connection_pool, default_queue_name="arq:pdf_queue"
        )
        self.redis = redis

    async def check_job_existing(self, pdf_bytes: bytes, user_id: int):
        # 2. Idempotency Check (Anti double-submit)
        file_hash = hashlib.sha256(pdf_bytes + str(user_id).encode()).hexdigest()
        lock_key = f"idempotency:import:{file_hash}"
        is_locked = await self.redis.setnx(lock_key, "1")
        if not is_locked:
            # Optionally return existing job id if stored, but throwing error is safer for double clicks
            raise ValueError("Duplicate upload detected. Please wait.")
        await self.redis.expire(lock_key, 15)  # 15 seconds TTL

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
