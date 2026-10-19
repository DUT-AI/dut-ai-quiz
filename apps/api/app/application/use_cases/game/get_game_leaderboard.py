import asyncio

from app.application.dtos import GameLeaderboardRowDTO
from app.application.services.user_service import UserService
from app.domain.interfaces import IGameSessionRepository
from app.infrastructure.cache.game_leaderboard_cache import GameLeaderboardCache


class GetGameLeaderboardUseCase:
    def __init__(
        self,
        ps_repo: IGameSessionRepository,
        cache: GameLeaderboardCache,
        user_service: UserService,
    ):
        self._ps_repo = ps_repo
        self._cache = cache
        self._user_service = user_service

    async def execute(self, lesson_slug: str, limit: int = 100) -> list[GameLeaderboardRowDTO]:
        cached = await self._cache.get(lesson_slug)
        if cached is not None:
            return cached

        raw_leaderboard = await self._ps_repo.get_leaderboard_by_lesson(lesson_slug, limit)

        missing_uids = list({row["user_id"] for row in raw_leaderboard if not row.get("username")})
        if missing_uids:
            async def fetch_one(uid: int):
                try:
                    return uid, await self._user_service.get_user_info(uid)
                except Exception:
                    return uid, None

            # Fetch user infos in parallel instead of sequentially
            results = await asyncio.gather(*(fetch_one(uid) for uid in missing_uids))
            user_map = {uid: info for uid, info in results if info}

            for row in raw_leaderboard:
                if not row.get("username"):
                    info = user_map.get(row["user_id"])
                    if info:
                        row["username"] = info.name
                        row["avatar_url"] = info.avatar_url
                    else:
                        row["username"] = f"Dũng Sĩ #{row['user_id']}"

        leaderboard = [GameLeaderboardRowDTO.model_validate(row) for row in raw_leaderboard]
        await self._cache.set(lesson_slug, leaderboard)
        return leaderboard
