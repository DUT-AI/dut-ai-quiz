"""
Redis Heartbeat Lock Use Cases — Step 7.

AcquireLockUseCase: Thiết lập Redis lock khi admin mở câu hỏi DRAFT.
HeartbeatLockUseCase: Gia hạn TTL lock mỗi 30 giây từ frontend.
"""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from app.config import settings
from app.infrastructure.persistence.models import Question
from redis.asyncio import Redis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


class AcquireLockUseCase:
    """Thiết lập review lock khi admin bắt đầu xem xét một câu hỏi DRAFT."""

    def __init__(self, session: AsyncSession, redis: Redis) -> None:
        self._s = session
        self._redis = redis

    async def execute(self, question_id: UUID, admin_id: int) -> dict:
        lock_key = f"lock:question:{question_id}"
        ttl = settings.review_lock_ttl_seconds

        # Check if already locked by another admin
        existing = await self._redis.get(lock_key)
        if existing and int(existing) != admin_id:
            return {
                "ok": False,
                "locked_by": int(existing),
                "error": f"Câu hỏi đang được admin #{existing} review",
            }

        # Set lock with TTL
        await self._redis.setex(lock_key, ttl, str(admin_id))

        # Update DB review_locked_by field
        r = await self._s.execute(select(Question).where(Question.id == question_id))
        model = r.scalar_one_or_none()
        if model:
            model.review_locked_by = admin_id
            model.review_locked_at = datetime.now(UTC)
            await self._s.flush()

        return {
            "ok": True,
            "question_id": str(question_id),
            "locked_by": admin_id,
            "ttl_seconds": ttl,
        }


class HeartbeatLockUseCase:
    """Gia hạn Redis lock TTL (gọi mỗi 30s từ frontend)."""

    def __init__(self, redis: Redis) -> None:
        self._redis = redis

    async def execute(self, question_id: UUID, admin_id: int) -> dict:
        lock_key = f"lock:question:{question_id}"
        ttl = settings.review_lock_ttl_seconds

        existing = await self._redis.get(lock_key)
        if not existing:
            # Lock expired — re-acquire
            await self._redis.setex(lock_key, ttl, str(admin_id))
            return {"ok": True, "renewed": True, "ttl_seconds": ttl}

        if int(existing) != admin_id:
            return {
                "ok": False,
                "error": f"Lock hiện thuộc về admin #{existing}",
            }

        await self._redis.expire(lock_key, ttl)
        return {"ok": True, "renewed": True, "ttl_seconds": ttl}
