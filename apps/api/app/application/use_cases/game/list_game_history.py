from app.domain.entities.game import GameSessionEntity
from app.domain.interfaces import IGameSessionRepository


class ListGameHistoryUseCase:
    def __init__(self, ps_repo: IGameSessionRepository):
        self._ps_repo = ps_repo

    async def execute(self, user_id: int) -> list[GameSessionEntity]:
        return await self._ps_repo.list_history(user_id)
