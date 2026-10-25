from app.application.services.game_hydration import GameHydrationService
from app.domain.interfaces import IGameSessionRepository
from app.presentation.schemas.game import GameSessionOut


class ListGameHistoryUseCase:
    def __init__(
        self,
        ps_repo: IGameSessionRepository,
        hydration: GameHydrationService,
    ) -> None:
        self._ps_repo = ps_repo
        self._hydration = hydration

    async def execute(self, user_id: int) -> list[GameSessionOut]:
        sessions = await self._ps_repo.list_history(user_id)
        return [self._hydration.to_history_out(s) for s in sessions]
