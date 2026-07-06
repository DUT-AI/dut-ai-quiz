from uuid import UUID

from app.domain.entities.game import GameSessionEntity
from app.domain.interfaces import IGameSessionRepository


class GetGameSessionUseCase:
    def __init__(self, ps_repo: IGameSessionRepository):
        self._ps_repo = ps_repo

    async def execute(
        self, session_id: UUID, user_id: int
    ) -> GameSessionEntity | None:
        session = await self._ps_repo.get(session_id)
        if not session or session.user_id != user_id:
            return None
        return session
