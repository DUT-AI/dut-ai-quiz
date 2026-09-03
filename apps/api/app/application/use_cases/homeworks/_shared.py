import asyncio
from io import BytesIO
from pathlib import Path
from urllib.parse import urlsplit
from uuid import UUID

from app.application.dtos.homework import HomeworkFileDTO, HomeworkOutDTO
from app.config import settings
from app.core.datetime_utils import now_ict
from app.domain.entities.homework import HomeworkEntity, HomeworkSubmissionEntity
from app.domain.exceptions.exceptions import AppException
from app.domain.interfaces import IS3Client
from app.domain.interfaces.homework_repo import IHomeworkRepository

HOMEWORK_ATTACHMENT_SUFFIXES = (".zip",)
HOMEWORK_SUBMISSION_SUFFIXES = (".zip", ".rar", ".7z", ".tar.gz", ".gz")


async def get_homework_or_raise(
    repository: IHomeworkRepository,
    homework_id: UUID,
) -> HomeworkEntity:
    homework = await repository.get_homework(homework_id)
    if homework is None:
        raise AppException("Bài tập không tồn tại", 404)
    return homework


async def ensure_lesson_exists(
    repository: IHomeworkRepository,
    lesson_id: UUID,
) -> None:
    if not await repository.lesson_exists(lesson_id):
        raise AppException("Bài học không tồn tại", 404)


async def upload_homework_file(
    storage: IS3Client,
    file: HomeworkFileDTO | None,
    *,
    prefix: str,
    allowed_suffixes: tuple[str, ...],
) -> str | None:
    if file is None:
        return None

    filename = Path(file.filename or "file").name
    if not filename.casefold().endswith(allowed_suffixes):
        suffix_list = ", ".join(allowed_suffixes)
        raise AppException(
            f"Chỉ chấp nhận file: {suffix_list}",
            400,
        )
    if len(file.content) > settings.homework_max_file_size_bytes:
        max_size_mb = settings.homework_max_file_size_bytes // (1024 * 1024)
        raise AppException(f"File vượt quá giới hạn {max_size_mb} MB", 400)
    if not file.content:
        raise AppException("File rỗng", 400)
    if not settings.s3_is_configured:
        raise AppException("Kho lưu trữ chưa được cấu hình", 503)

    stamp = now_ict().strftime("%Y%m%d_%H%M%S_%f")
    key = f"{prefix}/{stamp}_{filename}"
    await asyncio.to_thread(
        storage.upload_fileobj,
        BytesIO(file.content),
        settings.s3_bucket_name,
        key,
    )
    return key


async def generate_download_url(storage: IS3Client, key: str) -> str:
    parsed = urlsplit(key)
    if parsed.scheme in {"http", "https"} and parsed.netloc:
        return key
    if not settings.s3_is_configured:
        raise AppException("Kho lưu trữ chưa được cấu hình", 503)
    return await asyncio.to_thread(
        storage.generate_presigned_download_url,
        settings.s3_bucket_name,
        key,
        settings.presigned_url_expire_seconds,
    )


async def build_homework_out(
    repository: IHomeworkRepository,
    homework: HomeworkEntity,
    *,
    current_submission: HomeworkSubmissionEntity | None = None,
) -> HomeworkOutDTO:
    if homework.id is None:
        raise ValueError("Homework must be persisted")
    return HomeworkOutDTO.from_entity(
        homework,
        submitted_count=await repository.count_submitters(homework.id),
        current_submission=current_submission,
    )
