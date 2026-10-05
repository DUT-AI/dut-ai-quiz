from app.domain.interfaces import IGameSessionRepository


class ListGameSessionsForSyncUseCase:
    def __init__(self, ps_repo: IGameSessionRepository) -> None:
        self._ps_repo = ps_repo

    async def execute(self, lesson_slug: str) -> list[dict]:
        return await self._ps_repo.list_completed_sessions_for_sync(lesson_slug)
