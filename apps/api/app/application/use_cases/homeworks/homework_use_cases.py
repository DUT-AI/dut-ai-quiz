import asyncio
from datetime import datetime
from io import BytesIO
from pathlib import Path
from uuid import UUID

from fastapi import UploadFile

from app.config import settings
from app.core.datetime_utils import now_ict
from app.domain.entities.homework import (
    HomeworkEntity,
    HomeworkSubmissionEntity,
    HomeworkSubmissionStatus,
)
from app.domain.exceptions.exceptions import AppException
from app.domain.interfaces import IManageService, IS3Client
from app.domain.interfaces.homework_queue import IHomeworkEvaluationQueue
from app.domain.interfaces.homework_repo import IHomeworkRepository


ALLOWED_ARCHIVE_SUFFIXES = (".zip", ".rar", ".7z", ".tar.gz", ".gz")


class HomeworkUseCases:
    def __init__(
        self,
        repository: IHomeworkRepository,
        manage_service: IManageService,
        storage: IS3Client,
        queue: IHomeworkEvaluationQueue,
    ) -> None:
        self._repository = repository
        self._manage_service = manage_service
        self._storage = storage
        self._queue = queue

    async def list_for_user(
        self,
        user_id: int,
        lesson_id: UUID | None = None,
    ) -> list[tuple[HomeworkEntity, HomeworkSubmissionEntity | None]]:
        homeworks = await self._repository.list_homeworks(
            user_id=user_id,
            lesson_id=lesson_id,
        )
        return [
            (
                homework,
                await self._repository.get_latest_submission(homework.id, user_id),
            )
            for homework in homeworks
            if homework.id is not None
        ]

    async def list_all(
        self, lesson_id: UUID | None = None
    ) -> list[HomeworkEntity]:
        return await self._repository.list_homeworks(lesson_id=lesson_id)

    async def get(self, homework_id: UUID) -> HomeworkEntity:
        homework = await self._repository.get_homework(homework_id)
        if homework is None:
            raise AppException("Bài tập không tồn tại", 404)
        return homework

    async def create(
        self,
        *,
        lesson_id: UUID,
        title: str,
        description: str,
        deadline: datetime,
        created_by: int,
        assignee_ids: list[int],
        team_ids: list[int],
        file: UploadFile | None,
    ) -> HomeworkEntity:
        await self._ensure_lesson(lesson_id)
        assigned = await self._resolve_assignees(assignee_ids, team_ids)
        attachment_key = await self._upload(
            file, prefix="homeworks/attachments", required_archive=False
        )
        homework = await self._repository.create_homework(
            HomeworkEntity(
                lesson_id=lesson_id,
                title=title.strip(),
                description=description.strip(),
                deadline=deadline,
                attachment_key=attachment_key,
                created_by=created_by,
            )
        )
        assert homework.id is not None
        await self._repository.replace_assignments(homework.id, assigned)
        homework.assignee_ids = sorted(assigned)
        await self._queue.enqueue_registration(homework.id)
        return homework

    async def update(
        self,
        homework_id: UUID,
        *,
        lesson_id: UUID | None,
        title: str | None,
        description: str | None,
        deadline: datetime | None,
        assignee_ids: list[int] | None,
        team_ids: list[int] | None,
        file: UploadFile | None,
    ) -> HomeworkEntity:
        homework = await self.get(homework_id)
        if lesson_id is not None:
            await self._ensure_lesson(lesson_id)
            homework.lesson_id = lesson_id
        if title is not None:
            homework.title = title.strip()
        if description is not None:
            homework.description = description.strip()
        if deadline is not None:
            homework.deadline = deadline
        if file is not None:
            homework.attachment_key = await self._upload(
                file, prefix="homeworks/attachments", required_archive=False
            )
        if assignee_ids is not None or team_ids is not None:
            assigned = await self._resolve_assignees(
                assignee_ids or [], team_ids or []
            )
            await self._repository.replace_assignments(homework_id, assigned)
            homework.assignee_ids = sorted(assigned)
        updated = await self._repository.update_homework(homework)
        await self._queue.enqueue_registration(homework_id)
        return updated

    async def archive(self, homework_id: UUID) -> None:
        if not await self._repository.archive_homework(homework_id):
            raise AppException("Bài tập không tồn tại", 404)

    async def submit(
        self, homework_id: UUID, user_id: int, file: UploadFile
    ) -> HomeworkSubmissionEntity:
        homework = await self.get(homework_id)
        if not await self._repository.is_assigned(homework_id, user_id):
            raise AppException("Bạn không được giao bài tập này", 403)
        key = await self._upload(
            file,
            prefix=f"homeworks/{homework_id}/submissions/{user_id}",
            required_archive=True,
        )
        assert key is not None
        submission = await self._repository.create_submission(
            HomeworkSubmissionEntity(
                homework_id=homework_id,
                user_id=user_id,
                object_key=key,
                original_filename=file.filename or "submission.zip",
                submitted_at=now_ict(),
                is_late=now_ict() > homework.deadline,
                attempt_number=0,
                status=(
                    HomeworkSubmissionStatus.GRADING
                    if settings.submission_checker_api_url
                    else HomeworkSubmissionStatus.UPLOADED
                ),
            )
        )
        assert submission.id is not None
        await self._queue.enqueue_evaluation(submission.id)
        return submission

    async def latest_submission(
        self, homework_id: UUID, user_id: int
    ) -> HomeworkSubmissionEntity | None:
        if not await self._repository.is_assigned(homework_id, user_id):
            raise AppException("Bạn không được giao bài tập này", 403)
        return await self._repository.get_latest_submission(homework_id, user_id)

    async def get_submission(
        self, submission_id: UUID
    ) -> HomeworkSubmissionEntity:
        submission = await self._repository.get_submission(submission_id)
        if submission is None:
            raise AppException("Bài nộp không tồn tại", 404)
        return submission

    async def submissions(
        self, homework_id: UUID
    ) -> list[HomeworkSubmissionEntity]:
        await self.get(homework_id)
        return await self._repository.list_submissions(homework_id)

    async def unsubmitted(self, homework_id: UUID) -> list[int]:
        await self.get(homework_id)
        return await self._repository.unsubmitted_user_ids(homework_id)

    async def download_url(self, key: str) -> str:
        if not settings.s3_is_configured:
            raise AppException("Kho lưu trữ chưa được cấu hình", 503)
        return await asyncio.to_thread(
            self._storage.generate_presigned_download_url,
            settings.s3_bucket_name,
            key,
            settings.presigned_url_expire_seconds,
        )

    async def _resolve_assignees(
        self, assignee_ids: list[int], team_ids: list[int]
    ) -> set[int]:
        users, teams = await asyncio.gather(
            self._manage_service.get_users(),
            self._manage_service.get_teams(),
        )
        valid_user_ids = {user.user_id for user in users}
        requested = set(assignee_ids)
        unknown_users = requested - valid_user_ids
        if unknown_users:
            raise AppException(
                f"Người dùng không tồn tại: {sorted(unknown_users)}", 400
            )
        team_map = {team.id: team for team in teams}
        unknown_teams = set(team_ids) - set(team_map)
        if unknown_teams:
            raise AppException(f"Team không tồn tại: {sorted(unknown_teams)}", 400)
        for team_id in team_ids:
            requested.update(member.user_id for member in team_map[team_id].members)
        if not requested:
            raise AppException("Cần chọn ít nhất một người nhận bài", 400)
        return requested

    async def _ensure_lesson(self, lesson_id: UUID) -> None:
        if not await self._repository.lesson_exists(lesson_id):
            raise AppException("Bài học không tồn tại", 404)

    async def _upload(
        self,
        file: UploadFile | None,
        *,
        prefix: str,
        required_archive: bool,
    ) -> str | None:
        if file is None:
            return None
        if not settings.s3_is_configured:
            raise AppException("Kho lưu trữ chưa được cấu hình", 503)
        filename = Path(file.filename or "file").name
        if required_archive and not filename.casefold().endswith(
            ALLOWED_ARCHIVE_SUFFIXES
        ):
            raise AppException(
                "Chỉ chấp nhận file .zip, .rar, .7z, .tar.gz hoặc .gz", 400
            )
        content = await file.read(settings.homework_max_file_size_bytes + 1)
        if len(content) > settings.homework_max_file_size_bytes:
            raise AppException("File vượt quá giới hạn 10 MB", 400)
        if not content:
            raise AppException("File rỗng", 400)
        stamp = now_ict().strftime("%Y%m%d_%H%M%S_%f")
        key = f"{prefix}/{stamp}_{filename}"
        await asyncio.to_thread(
            self._storage.upload_fileobj,
            BytesIO(content),
            settings.s3_bucket_name,
            key,
        )
        return key
