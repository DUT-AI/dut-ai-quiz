from app.application.services.game_hydration import GameHydrationService
from app.domain.interfaces import IGameSessionRepository
from app.presentation.schemas.game import GameSessionOut


class GetActiveGameSessionUseCase:
    def __init__(
        self,
        ps_repo: IGameSessionRepository,
        hydration: GameHydrationService,
    ) -> None:
        self._ps_repo = ps_repo
        self._hydration = hydration

    async def execute(self, user_id: int, lesson_slug: str) -> GameSessionOut | None:
        session = await self._ps_repo.get_active_by_lesson(user_id, lesson_slug)
        if not session:
            return None
        return await self._hydration.to_session_out(session)
