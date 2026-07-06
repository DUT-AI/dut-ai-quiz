from uuid import UUID

from app.domain.entities.practice import PracticeSessionEntity
from app.domain.interfaces import IPracticeSessionRepository


class GetPracticeSessionUseCase:
    def __init__(self, ps_repo: IPracticeSessionRepository):
        self._ps_repo = ps_repo

    async def execute(
        self, session_id: UUID, user_id: int
    ) -> PracticeSessionEntity | None:
        session = await self._ps_repo.get(session_id)
        if not session or session.user_id != user_id:
            return None
        return session
