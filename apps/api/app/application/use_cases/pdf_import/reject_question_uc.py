"""
RejectQuestionUseCase — Xóa câu hỏi DRAFT + dọn ảnh MinIO liên quan.

Khi admin xóa câu hỏi DRAFT:
1. Tìm tất cả ảnh được nhúng trong content (dạng MinIO URL)
2. Xóa ảnh khỏi MinIO
3. Xóa bản ghi câu hỏi khỏi DB
4. Xóa Redis lock nếu còn
"""

from __future__ import annotations

import re
from uuid import UUID

from app.config import settings
from app.domain.interfaces.s3_client import IS3Client
from app.infrastructure.persistence.models import Question
from loguru import logger
from redis.asyncio import Redis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

# Pattern to find MinIO image URLs embedded in question content
MINIO_URL_PATTERN = re.compile(r"https?://[^\s\"']+/uploads/pdf-images/[^\s\"']+")


class RejectQuestionUseCase:
    def __init__(self, session: AsyncSession, redis: Redis, s3_client: IS3Client) -> None:
        self._s = session
        self._redis = redis
        self._s3 = s3_client

    async def execute(self, question_id: UUID, admin_id: int) -> dict:
        """Delete DRAFT question and clean up associated MinIO images."""
        r = await self._s.execute(
            select(Question).where(
                Question.id == question_id,
                Question.status == "DRAFT",
            )
        )
        model = r.scalar_one_or_none()
        if not model:
            return {"ok": False, "error": "Câu hỏi không tồn tại hoặc không ở DRAFT"}

        # Extract and delete MinIO images from content
        image_urls = MINIO_URL_PATTERN.findall(model.content or "")
        for url in image_urls:
            try:
                key = self._extract_s3_key(url)
                if key:
                    self._s3._client.delete_object(Bucket=settings.pdf_upload_bucket, Key=key)
                    logger.info(f"Deleted MinIO object: {key}")
            except Exception as exc:
                logger.warning(f"Failed to delete MinIO image {url}: {exc}")

        # Delete from DB
        await self._s.delete(model)

        # Release Redis lock
        lock_key = f"lock:question:{question_id}"
        await self._redis.delete(lock_key)

        return {"ok": True, "question_id": str(question_id), "deleted": True}

    def _extract_s3_key(self, url: str) -> str | None:
        """Extract S3 object key from full MinIO URL."""
        # e.g. https://minio.dutai.site/lms-dev/uploads/pdf-images/job123/IMG_ABCD.png
        try:
            bucket = settings.pdf_upload_bucket
            marker = f"/{bucket}/"
            idx = url.find(marker)
            if idx == -1:
                return None
            return url[idx + len(marker) :]
        except Exception:
            return None
