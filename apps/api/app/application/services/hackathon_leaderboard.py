from uuid import UUID

from app.domain.exceptions.exceptions import AppException
from app.domain.interfaces.hackathon_repo import (
    IHackathonSubmissionRepository,
    IHackathonTaskRepository,
)
from app.domain.services.hackathon_leaderboard import HackathonLeaderboardDomainService
from app.domain.value_objects.hackathon_leaderboard import HackathonLeaderboardRow

class HackathonLeaderboardAppService:
    def __init__(
        self,
        sub_repo: IHackathonSubmissionRepository,
        task_repo: IHackathonTaskRepository,
        domain_service: HackathonLeaderboardDomainService,
    ) -> None:
        self._sub_repo = sub_repo
        self._task_repo = task_repo
        self._domain_service = domain_service

    async def get_leaderboard(
        self, hackathon_id: UUID, is_private: bool = False, limit: int = 100
    ) -> list[HackathonLeaderboardRow]:
        tasks = await self._task_repo.list_for_hackathon(hackathon_id)
        if not tasks:
            return []

        submissions = await self._sub_repo.list_for_hackathon(hackathon_id)
        
        return self._domain_service.calculate_leaderboard(
            tasks=tasks,
            submissions=submissions,
            is_private=is_private,
            limit=limit,
        )

