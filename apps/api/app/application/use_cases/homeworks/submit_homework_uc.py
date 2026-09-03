from app.application.dtos.homework import (
    HomeworkSubmissionOutDTO,
    SubmitHomeworkDTO,
)
from app.config import settings
from app.core.datetime_utils import now_ict
from app.domain.entities.homework import (
    HomeworkSubmissionEntity,
    HomeworkSubmissionStatus,
)
from app.domain.interfaces import IS3Client
from app.domain.interfaces.homework_queue import IHomeworkEvaluationQueue
from app.domain.interfaces.homework_repo import IHomeworkRepository

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
    ) -> None:
        self._repository = repository
        self._storage = storage
        self._queue = queue

    async def execute(
        self,
        payload: SubmitHomeworkDTO,
    ) -> HomeworkSubmissionOutDTO:
        await get_homework_or_raise(
            self._repository,
            payload.homework_id,
        )
        key = await upload_homework_file(
            self._storage,
            payload.file,
            prefix=(f"homeworks/{payload.homework_id}/submissions/{payload.user_id}"),
            allowed_suffixes=HOMEWORK_SUBMISSION_SUFFIXES,
        )
        if key is None:
            raise ValueError("Submission file is required")

        submitted_at = now_ict()
        submission = await self._repository.create_submission(
            HomeworkSubmissionEntity(
                homework_id=payload.homework_id,
                user_id=payload.user_id,
                object_key=key,
                original_filename=payload.file.filename,
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
        return HomeworkSubmissionOutDTO.from_entity(submission)
