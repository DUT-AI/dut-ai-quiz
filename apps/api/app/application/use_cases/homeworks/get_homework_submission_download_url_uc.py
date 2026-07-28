from uuid import UUID

from app.domain.exceptions.exceptions import AppException
from app.domain.interfaces import IS3Client
from app.domain.interfaces.homework_repo import IHomeworkRepository

from ._shared import generate_download_url


class GetHomeworkSubmissionDownloadUrlUseCase:
    def __init__(
        self,
        repository: IHomeworkRepository,
        storage: IS3Client,
    ) -> None:
        self._repository = repository
        self._storage = storage

    async def execute(
        self,
        submission_id: UUID,
        requester_id: int,
        *,
        can_manage: bool,
    ) -> str:
        submission = await self._repository.get_submission(submission_id)
        if submission is None:
            raise AppException("Bài nộp không tồn tại", 404)
        if not can_manage and submission.user_id != requester_id:
            raise AppException("Bạn không được truy cập bài nộp này", 403)
        return await generate_download_url(
            self._storage,
            submission.object_key,
        )
