from uuid import UUID

from app.application.dtos.homework import HomeworkOutDTO
from app.domain.interfaces.homework_repo import IHomeworkRepository

from ._shared import build_homework_out, get_homework_or_raise


class GetHomeworkUseCase:
    def __init__(self, repository: IHomeworkRepository) -> None:
        self._repository = repository

    async def execute(self, homework_id: UUID) -> HomeworkOutDTO:
        homework = await get_homework_or_raise(self._repository, homework_id)
        return await build_homework_out(self._repository, homework)
