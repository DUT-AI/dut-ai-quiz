from uuid import UUID

from app.application.services.hackathon_leaderboard import HackathonLeaderboardAppService
from app.domain.interfaces import IHackathonLeaderboardCache


class ViewHackathonLeaderboardUseCase:
    def __init__(
        self,
        cache: IHackathonLeaderboardCache,
        leaderboard_service: HackathonLeaderboardAppService,
    ) -> None:
        self._cache = cache
        self._leaderboard_service = leaderboard_service

    async def __call__(
        self,
        hackathon_id: UUID,
        is_private: bool = False,
        limit: int = 100,
        force_refresh: bool = False,
    ) -> list[dict]:
        if force_refresh:
            await self._cache.invalidate(hackathon_id)

        cached = await self._cache.get(hackathon_id, is_private)
        if cached is not None:
            return cached

        rows = await self._leaderboard_service.get_leaderboard(hackathon_id, is_private=is_private, limit=limit)
        data = [row.to_dict() for row in rows]

        await self._cache.set(hackathon_id, data, is_private=is_private)
        return data
