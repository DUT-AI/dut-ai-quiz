from uuid import UUID

from app.application.dtos.homework import HomeworkOutDTO
from app.domain.interfaces.homework_repo import IHomeworkRepository

from ._shared import build_homework_out


class ListHomeworksUseCase:
    def __init__(self, repository: IHomeworkRepository) -> None:
        self._repository = repository

    async def execute(
        self,
        lesson_id: UUID | None = None,
    ) -> list[HomeworkOutDTO]:
        result: list[HomeworkOutDTO] = []
        for homework in await self._repository.list_homeworks(lesson_id=lesson_id):
            result.append(await build_homework_out(self._repository, homework))
        return result
