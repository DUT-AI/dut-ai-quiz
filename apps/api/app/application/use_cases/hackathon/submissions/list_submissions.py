from uuid import UUID

from app.domain.entities.submission import HackathonSubmissionEntity
from app.domain.exceptions.exceptions import AppException
from app.domain.interfaces.hackathon_repo import (
    IHackathonSubmissionRepository,
    IHackathonTeamRepository,
    IHackathonTaskRepository,
)


class ListSubmissionsUseCase:
    def __init__(
        self,
        sub_repo: IHackathonSubmissionRepository,
        team_repo: IHackathonTeamRepository,
        task_repo: IHackathonTaskRepository,
    ) -> None:
        self._sub_repo = sub_repo
        self._team_repo = team_repo
        self._task_repo = task_repo

    async def __call__(
        self, task_id: UUID, user_id: int, quiz_role: str
    ) -> list[HackathonSubmissionEntity]:
        # 1. Kiểm tra sự tồn tại của Task
        task = await self._task_repo.get(task_id)
        if not task:
            raise AppException("Bài tập không tồn tại", 404)

        # 2. Phân quyền và truy vấn lịch sử nộp bài
        # Admin / Mentor có quyền xem toàn bộ lượt nộp của bài tập này
        if quiz_role in ("admin", "mentor"):
            return await self._sub_repo.list_for_task(task_id)

        # Thí sinh chỉ được xem lịch sử nộp bài của cá nhân hoặc đội của mình
        team = await self._team_repo.get_user_team(task.hackathon_id, user_id)
        if team:
            return await self._sub_repo.list_for_task(task_id, team_id=team.id)
        else:
            return await self._sub_repo.list_for_task(task_id, user_id=user_id)
