from uuid import UUID

from app.domain.interfaces.homework_repo import IHomeworkRepository

from ._shared import get_homework_or_raise


class ListUnsubmittedHomeworkUsersUseCase:
    def __init__(self, repository: IHomeworkRepository) -> None:
        self._repository = repository

    async def execute(self, homework_id: UUID) -> list[int]:
        await get_homework_or_raise(self._repository, homework_id)
        return await self._repository.unsubmitted_user_ids(homework_id)
