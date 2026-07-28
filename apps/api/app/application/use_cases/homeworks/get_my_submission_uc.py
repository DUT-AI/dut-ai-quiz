from uuid import UUID

from app.application.dtos.homework import HomeworkSubmissionOutDTO
from app.domain.interfaces.homework_repo import IHomeworkRepository

from ._shared import get_homework_or_raise


class GetMyHomeworkSubmissionUseCase:
    def __init__(self, repository: IHomeworkRepository) -> None:
        self._repository = repository

    async def execute(
        self,
        homework_id: UUID,
        user_id: int,
    ) -> HomeworkSubmissionOutDTO | None:
        await get_homework_or_raise(self._repository, homework_id)
        submission = await self._repository.get_latest_submission(
            homework_id,
            user_id,
        )
        return HomeworkSubmissionOutDTO.from_entity(submission) if submission else None
