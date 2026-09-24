from app.domain.entities.game import GameSessionEntity
from app.domain.interfaces import IGameSessionRepository


class GetActiveGameSessionUseCase:
    def __init__(self, ps_repo: IGameSessionRepository):
        self._ps_repo = ps_repo

    async def execute(self, user_id: int, lesson_slug: str) -> GameSessionEntity | None:
        return await self._ps_repo.get_active_by_lesson(user_id, lesson_slug)
