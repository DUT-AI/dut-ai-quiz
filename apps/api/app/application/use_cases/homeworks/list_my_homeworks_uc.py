from uuid import UUID

from app.application.dtos.homework import HomeworkOutDTO
from app.domain.interfaces.homework_repo import IHomeworkRepository

from ._shared import build_homework_out


class ListMyHomeworksUseCase:
    def __init__(self, repository: IHomeworkRepository) -> None:
        self._repository = repository

    async def execute(
        self,
        user_id: int,
        lesson_id: UUID | None = None,
    ) -> list[HomeworkOutDTO]:
        result: list[HomeworkOutDTO] = []
        homeworks = await self._repository.list_homeworks(lesson_id=lesson_id)
        for homework in homeworks:
            if homework.id is None:
                continue
            current_submission = await self._repository.get_latest_submission(
                homework.id,
                user_id,
            )
            result.append(
                await build_homework_out(
                    self._repository,
                    homework,
                    current_submission=current_submission,
                )
            )
        return result
