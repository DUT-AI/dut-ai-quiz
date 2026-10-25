from uuid import UUID

from app.application.services.game_hydration import GameHydrationService
from app.core.datetime_utils import now_ict
from app.domain.interfaces import IGameSessionRepository
from app.domain.value_objects import GameSessionStatus
from app.infrastructure.cache.game_leaderboard_cache import GameLeaderboardCache
from app.presentation.schemas.game import GameSessionOut


class FinishGameSessionUseCase:
    def __init__(
        self,
        ps_repo: IGameSessionRepository,
        hydration: GameHydrationService,
        cache: GameLeaderboardCache | None = None,
    ) -> None:
        self._ps_repo = ps_repo
        self._hydration = hydration
        self._cache = cache

    async def execute(self, session_id: UUID, user_id: int) -> GameSessionOut | None:
        session = await self._ps_repo.get(session_id)
        if not session or session.user_id != user_id:
            return None

        if session.status != GameSessionStatus.COMPLETED:
            session.status = GameSessionStatus.COMPLETED
            session.completed_at = now_ict()

            lesson_slug = session.lesson_slug or "unknown"
            count_completed = await self._ps_repo.count_completed_by_lesson(user_id, lesson_slug)
            session.gamification.finalize_score(count_completed)

            if self._cache:
                await self._cache.invalidate(lesson_slug)

            session = await self._ps_repo.save(session)

        return await self._hydration.to_session_out(session, include_current_question=False)
