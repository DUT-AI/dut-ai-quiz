from app.domain.entities.practice import PracticeSessionEntity
from app.domain.interfaces import IPracticeSessionRepository


class GetActivePracticeSessionUseCase:
    def __init__(self, ps_repo: IPracticeSessionRepository):
        self._ps_repo = ps_repo

    async def execute(
        self, user_id: int, lesson_slug: str
    ) -> PracticeSessionEntity | None:
        return await self._ps_repo.get_active_by_lesson(user_id, lesson_slug)
