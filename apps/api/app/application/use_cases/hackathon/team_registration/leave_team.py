from datetime import datetime
from uuid import UUID

from app.domain.exceptions.exceptions import AppException
from app.domain.entities.hackathon import RegistrationStatus
from app.infrastructure.repositories.hackathons import (
    HackathonRegistrationRepository,
    HackathonRepository,
    HackathonTeamRepository,
)


class LeaveTeamUseCase:
    def __init__(
        self,
        hackathon_repo: HackathonRepository,
        team_repo: HackathonTeamRepository,
        reg_repo: HackathonRegistrationRepository,
    ) -> None:
        self._hackathon_repo = hackathon_repo
        self._team_repo = team_repo
        self._reg_repo = reg_repo

    async def __call__(
        self, hackathon_id: UUID, user_id: int, new_leader_id: int | None = None
    ) -> None:
        hackathon = await self._hackathon_repo.get(hackathon_id)
        if not hackathon:
            raise AppException("Hackathon không tồn tại", 404)

        if hackathon.start_time and datetime.now() > hackathon.start_time:
            raise AppException("Không thể rời đội sau khi đã hết hạn đăng ký", 400)

        team = await self._team_repo.get_user_team(hackathon_id, user_id)
        if not team:
            raise AppException("Bạn không thuộc đội thi nào trong hackathon này", 400)

        # Nếu là Leader
        if team.leader_id == user_id:
            other_members = [m for m in team.member_ids if m != user_id]
            if not other_members:
                # Không còn ai khác -> giải tán đội
                reg = await self._reg_repo.get_team_registration(hackathon_id, team.id)
                if reg:
                    reg.status = RegistrationStatus.CANCELLED
                    await self._reg_repo.update(reg)
                await self._team_repo.delete(team)
                return
            else:
                # Còn thành viên khác -> bắt buộc chỉ định leader mới
                if not new_leader_id:
                    raise AppException(
                        "Bạn là trưởng nhóm. Hãy chỉ định một trưởng nhóm mới trước khi rời đội.",
                        400,
                    )
                if new_leader_id not in other_members:
                    raise AppException(
                        "Trưởng nhóm mới được chỉ định phải thuộc thành viên của đội.",
                        400,
                    )

                team.leader_id = new_leader_id
                team.member_ids = other_members
                await self._team_repo.update(team)
        else:
            # Thành viên bình thường rời đội
            team.member_ids = [m for m in team.member_ids if m != user_id]
            await self._team_repo.update(team)
