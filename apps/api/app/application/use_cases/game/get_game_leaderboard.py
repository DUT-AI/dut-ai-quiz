from app.domain.interfaces import IGameSessionRepository
from app.infrastructure.cache.game_leaderboard_cache import GameLeaderboardCache
from app.application.services.user_service import UserService


class GetGameLeaderboardUseCase:
    def __init__(
        self,
        ps_repo: IGameSessionRepository,
        cache: GameLeaderboardCache,
        user_service: UserService = None,
    ):
        self._ps_repo = ps_repo
        self._cache = cache
        self._user_service = user_service

    async def execute(self, lesson_slug: str, limit: int = 100) -> list[dict]:
        cached = await self._cache.get(lesson_slug)
        if cached is not None:
            return cached

        leaderboard = await self._ps_repo.get_leaderboard_by_lesson(lesson_slug, limit)
        
        if self._user_service:
            for row in leaderboard:
                if not row.get("username"):
                    try:
                        user_info = await self._user_service.get_user_info(row["user_id"])
                        row["username"] = user_info.name
                        row["avatar_url"] = user_info.avatar_url
                    except Exception:
                        pass
                        
        await self._cache.set(lesson_slug, leaderboard)
        return leaderboard
