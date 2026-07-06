from app.domain.interfaces import IPracticeSessionRepository
from app.infrastructure.cache.practice_leaderboard_cache import PracticeLeaderboardCache


class GetPracticeLeaderboardUseCase:
    def __init__(
        self, ps_repo: IPracticeSessionRepository, cache: PracticeLeaderboardCache
    ):
        self._ps_repo = ps_repo
        self._cache = cache

    async def execute(self, lesson_slug: str, limit: int = 100) -> list[dict]:
        cached = await self._cache.get(lesson_slug)
        if cached is not None:
            return cached

        leaderboard = await self._ps_repo.get_leaderboard_by_lesson(lesson_slug, limit)
        await self._cache.set(lesson_slug, leaderboard)
        return leaderboard
