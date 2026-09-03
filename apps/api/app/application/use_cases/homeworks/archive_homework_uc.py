from uuid import UUID

from app.domain.exceptions.exceptions import AppException
from app.domain.interfaces.homework_repo import IHomeworkRepository


class ArchiveHomeworkUseCase:
    def __init__(self, repository: IHomeworkRepository) -> None:
        self._repository = repository

    async def execute(self, homework_id: UUID) -> None:
        if not await self._repository.archive_homework(homework_id):
            raise AppException("Bài tập không tồn tại", 404)
