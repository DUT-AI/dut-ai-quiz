from app.application.dtos.homework import (
    HomeworkSubmissionOutDTO,
    SubmitHomeworkDTO,
)
from app.config import settings
from app.core.datetime_utils import now_ict
from app.domain.entities.homework import (
    HomeworkSubmissionEntity,
    HomeworkSubmissionStatus,
    SubmissionType,
)
from app.domain.interfaces import IS3Client
from app.domain.interfaces.homework_queue import IHomeworkEvaluationQueue
from app.domain.interfaces.homework_repo import IHomeworkRepository
from app.domain.interfaces.lesson_repo import ILessonRepository
from app.infrastructure.services.manage_webhook import dispatch_manage_submission_webhook
from loguru import logger

from ._shared import (
    HOMEWORK_SUBMISSION_SUFFIXES,
    get_homework_or_raise,
    upload_homework_file,
)


class SubmitHomeworkUseCase:
    def __init__(
        self,
        repository: IHomeworkRepository,
        storage: IS3Client,
        queue: IHomeworkEvaluationQueue,
        lesson_repo: ILessonRepository,
    ) -> None:
        self._repository = repository
        self._storage = storage
        self._queue = queue
        self._lesson_repo = lesson_repo

    async def execute(
        self,
        payload: SubmitHomeworkDTO,
    ) -> HomeworkSubmissionOutDTO:
        homework = await get_homework_or_raise(
            self._repository,
            payload.homework_id,
        )
        if payload.object_key:
            key = payload.object_key.strip()
            expected_prefix = f"homeworks/{payload.homework_id}/submissions/{payload.user_id}/"
            if not key.startswith(expected_prefix):
                raise ValueError("Khóa tệp nộp bài không hợp lệ")
            if not any(key.casefold().endswith(suffix) for suffix in HOMEWORK_SUBMISSION_SUFFIXES):
                raise ValueError("Định dạng file nộp bài không được hỗ trợ")
            original_filename = payload.original_filename or key.split("/")[-1]
        elif payload.file:
            key = await upload_homework_file(
                self._storage,
                payload.file,
                prefix=(f"homeworks/{payload.homework_id}/submissions/{payload.user_id}"),
                allowed_suffixes=HOMEWORK_SUBMISSION_SUFFIXES,
            )
            if key is None:
                raise ValueError("Submission file is required")
            original_filename = payload.file.filename
        else:
            raise ValueError("Submission file or object key is required")

        submitted_at = now_ict()
        submission = await self._repository.create_submission(
            HomeworkSubmissionEntity(
                homework_id=payload.homework_id,
                user_id=payload.user_id,
                object_key=key,
                original_filename=original_filename,
                submitted_at=submitted_at,
                is_late=False,
                attempt_number=0,
                status=(
                    HomeworkSubmissionStatus.GRADING
                    if settings.homework_grading_enabled
                    else HomeworkSubmissionStatus.UPLOADED
                ),
            )
        )
        if submission.id is None:
            raise ValueError("Created submission must be persisted")
        await self._queue.enqueue_evaluation(submission.id)

        # Bắn webhook sang Manage nếu học viên thuộc hệ thống Manage (UserSource.MANAGE)
        if homework.lesson_id:
            try:
                lesson = await self._lesson_repo.get(homework.lesson_id)
                if lesson and lesson.slug:
                    dispatch_manage_submission_webhook(
                        lesson_slug=lesson.slug,
                        user_id=payload.user_id,
                        submission_type=SubmissionType.CODING,
                        submitted_at=submission.submitted_at,
                        is_passed=True,
                        exercise_id=str(homework.id) if homework.id else None,
                        exercise_title=homework.title,
                        submission_id=str(submission.id),
                        attempt_number=submission.attempt_number,
                        score=submission.score,
                        original_filename=submission.original_filename,
                        details={
                            "submission_id": str(submission.id),
                            "attempt_number": submission.attempt_number,
                            "original_filename": submission.original_filename,
                            "exercise_id": str(homework.id) if homework.id else None,
                            "exercise_title": homework.title,
                            "score": submission.score,
                        },
                        user_source=payload.user_source,
                    )
            except Exception as e:
                logger.warning(f"Error dispatching coding submission webhook: {e}")


        return HomeworkSubmissionOutDTO.from_entity(submission)
