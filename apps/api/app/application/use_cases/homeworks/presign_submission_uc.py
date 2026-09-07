from pathlib import Path
from uuid import UUID

from app.config import settings
from app.core.datetime_utils import now_ict
from app.domain.exceptions.exceptions import AppException
from app.domain.interfaces import IS3Client
from app.domain.interfaces.homework_repo import IHomeworkRepository

from ._shared import HOMEWORK_SUBMISSION_SUFFIXES, get_homework_or_raise


class PresignHomeworkSubmissionUseCase:
    """Use case to generate a presigned PUT upload URL for student homework submissions."""

    def __init__(
        self,
        repository: IHomeworkRepository,
        storage: IS3Client,
    ) -> None:
        self._repository = repository
        self._storage = storage

    async def execute(
        self,
        *,
        homework_id: UUID,
        user_id: int,
        filename: str,
        content_type: str | None = None,
    ) -> dict[str, str]:
        if not settings.s3_is_configured:
            raise AppException("Kho lưu trữ chưa được cấu hình", 503)

        await get_homework_or_raise(self._repository, homework_id)

        # Sanitize filename to prevent path traversal
        safe_name = Path(filename.strip()).name
        if not safe_name:
            raise AppException("Tên file không hợp lệ", 400)

        lower_name = safe_name.casefold()
        if not any(lower_name.endswith(suffix) for suffix in HOMEWORK_SUBMISSION_SUFFIXES):
            allowed = ", ".join(HOMEWORK_SUBMISSION_SUFFIXES)
            raise AppException(f"Định dạng file không được hỗ trợ. Cho phép: {allowed}", 400)

        stamp = now_ict().strftime("%Y%m%d_%H%M%S_%f")
        key = f"homeworks/{homework_id}/submissions/{user_id}/{stamp}_{safe_name}"

        upload_url = self._storage.generate_presigned_upload_url(
            bucket=settings.s3_bucket_name,
            key=key,
            content_type=content_type or "application/octet-stream",
            expires_in=settings.presigned_url_expire_seconds,
        )

        return {
            "upload_url": upload_url,
            "object_key": key,
            "original_filename": safe_name,
        }
