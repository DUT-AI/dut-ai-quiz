from uuid import UUID

from app.application.services.game_hydration import GameHydrationService
from app.domain.interfaces import IGameSessionRepository
from app.presentation.schemas.game import GameSessionOut


class GetGameSessionUseCase:
    def __init__(
        self,
        ps_repo: IGameSessionRepository,
        hydration: GameHydrationService,
    ) -> None:
        self._ps_repo = ps_repo
        self._hydration = hydration

    async def execute(self, session_id: UUID, user_id: int) -> GameSessionOut | None:
        session = await self._ps_repo.get(session_id)
        if not session or session.user_id != user_id:
            return None
        return await self._hydration.to_session_out(session)
