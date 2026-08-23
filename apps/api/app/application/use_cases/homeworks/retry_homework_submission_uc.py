from uuid import UUID

from app.application.dtos.homework import HomeworkSubmissionOutDTO
from app.domain.entities.homework import HomeworkSubmissionStatus
from app.domain.exceptions.exceptions import AppException
from app.domain.interfaces.homework_queue import IHomeworkEvaluationQueue
from app.domain.interfaces.homework_repo import IHomeworkRepository


class RetryHomeworkSubmissionUseCase:
    """Queue the existing artifact again without creating a new attempt."""

    def __init__(
        self,
        repository: IHomeworkRepository,
        queue: IHomeworkEvaluationQueue,
    ) -> None:
        self._repository = repository
        self._queue = queue

    async def execute(
        self,
        submission_id: UUID,
        user_id: int,
    ) -> HomeworkSubmissionOutDTO:
        submission = await self._repository.get_submission(submission_id)
        if submission is None or submission.user_id != user_id:
            raise AppException("Bài nộp không tồn tại", 404)
        if submission.status != HomeworkSubmissionStatus.FAILED:
            raise AppException("Chỉ có thể chấm lại bài nộp đang bị lỗi", 409)

        retried = await self._repository.retry_failed_submission(submission_id)
        if retried is None:
            raise AppException("Bài nộp đã được yêu cầu chấm lại", 409)

        await self._queue.enqueue_evaluation(submission_id)
        return HomeworkSubmissionOutDTO.from_entity(retried)
