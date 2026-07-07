from uuid import UUID

from app.core.datetime_utils import now_ict
from app.domain.entities.game import GameSessionEntity
from app.domain.interfaces import IGameSessionRepository
from app.domain.value_objects import GameSessionStatus
from app.infrastructure.cache.game_leaderboard_cache import GameLeaderboardCache


class FinishGameSessionUseCase:
    def __init__(
        self,
        ps_repo: IGameSessionRepository,
        cache: GameLeaderboardCache = None,
    ):
        self._ps_repo = ps_repo
        self._cache = cache

    async def execute(
        self, session_id: UUID, user_id: int
    ) -> GameSessionEntity | None:
        session = await self._ps_repo.get(session_id)
        if not session or session.user_id != user_id:
            return None

        if session.status == GameSessionStatus.COMPLETED:
            return session

        session.status = GameSessionStatus.COMPLETED
        session.completed_at = now_ict()

        lesson_slug = session.snapshot.get("lesson_slug") or (
            session.tags_filter[0] if session.tags_filter else "unknown"
        )
        count_completed = await self._ps_repo.count_completed_by_lesson(
            user_id, lesson_slug
        )
        decay = max(0.2, 1.0 - (count_completed * 0.2))

        if "gamification" in session.snapshot:
            base_points = session.snapshot["gamification"].get("points", 0)
            session.snapshot["gamification"]["final_score"] = base_points * decay
            session.snapshot["gamification"]["attempt_count"] = count_completed + 1

        if self._cache:
            await self._cache.invalidate(lesson_slug)

        return await self._ps_repo.save(session)
