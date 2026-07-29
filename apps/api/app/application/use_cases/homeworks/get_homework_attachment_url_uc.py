from uuid import UUID

from app.domain.exceptions.exceptions import AppException
from app.domain.interfaces import IS3Client
from app.domain.interfaces.homework_repo import IHomeworkRepository

from ._shared import generate_download_url, get_homework_or_raise


class GetHomeworkAttachmentUrlUseCase:
    def __init__(
        self,
        repository: IHomeworkRepository,
        storage: IS3Client,
    ) -> None:
        self._repository = repository
        self._storage = storage

    async def execute(self, homework_id: UUID) -> str:
        homework = await get_homework_or_raise(
            self._repository,
            homework_id,
        )
        if not homework.attachment_key:
            raise AppException("Bài tập không có file đính kèm", 404)
        return await generate_download_url(
            self._storage,
            homework.attachment_key,
        )
