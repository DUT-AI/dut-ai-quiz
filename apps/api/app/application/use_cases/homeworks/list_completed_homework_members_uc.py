from uuid import UUID

from app.application.dtos.homework import CompletedHomeworkMemberOutDTO
from app.domain.interfaces.homework_repo import IHomeworkRepository

from ._shared import get_homework_or_raise


class ListCompletedHomeworkMembersUseCase:
    def __init__(self, repository: IHomeworkRepository) -> None:
        self._repository = repository

    async def execute(
        self,
        homework_id: UUID,
    ) -> list[CompletedHomeworkMemberOutDTO]:
        await get_homework_or_raise(self._repository, homework_id)
        return await self._repository.list_completed_members(homework_id)

