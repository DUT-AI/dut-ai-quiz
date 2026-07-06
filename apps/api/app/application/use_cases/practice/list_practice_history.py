from app.domain.entities.practice import PracticeSessionEntity
from app.domain.interfaces import IPracticeSessionRepository


class ListPracticeHistoryUseCase:
    def __init__(self, ps_repo: IPracticeSessionRepository):
        self._ps_repo = ps_repo

    async def execute(self, user_id: int) -> list[PracticeSessionEntity]:
        return await self._ps_repo.list_history(user_id)
