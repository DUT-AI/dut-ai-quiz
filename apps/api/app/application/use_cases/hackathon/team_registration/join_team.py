from datetime import datetime
from uuid import UUID

from app.application.dtos import HackathonTeamOutDTO
from app.application.services.user_service import UserService
from app.domain.exceptions.exceptions import AppException
from app.infrastructure.repositories.hackathons import (
    HackathonRegistrationRepository,
    HackathonRepository,
    HackathonTeamRepository,
)


class JoinTeamUseCase:
    def __init__(
        self,
        hackathon_repo: HackathonRepository,
        team_repo: HackathonTeamRepository,
        reg_repo: HackathonRegistrationRepository,
        user_service: UserService,
    ) -> None:
        self._hackathon_repo = hackathon_repo
        self._team_repo = team_repo
        self._reg_repo = reg_repo
        self._user_service = user_service

    async def __call__(
        self, hackathon_id: UUID, user_id: int, code: str
    ) -> HackathonTeamOutDTO:
        team = await self._team_repo.get_by_code(code.strip().upper())
        if not team:
            raise AppException("Mã đội thi không chính xác", 400)

        if team.hackathon_id != hackathon_id:
            raise AppException("Mã đội thi không thuộc giải đấu này", 400)

        hackathon = await self._hackathon_repo.get(team.hackathon_id)
        if not hackathon:
            raise AppException("Hackathon không tồn tại", 404)

        if hackathon.start_time and datetime.now() > hackathon.start_time:
            raise AppException("Thời hạn đăng ký đã kết thúc", 400)

        # Kiểm tra xem user đã ở đội khác chưa
        user_team = await self._team_repo.get_user_team(team.hackathon_id, user_id)
        if user_team:
            raise AppException("Bạn đã tham gia một đội thi trong hackathon này", 400)

        # Kiểm tra xem user đã đăng ký cá nhân chưa
        existing_reg = await self._reg_repo.get_user_registration(
            team.hackathon_id, user_id
        )
        if existing_reg:
            raise AppException(
                "Bạn đã đăng ký tham gia hackathon này với tư cách cá nhân", 400
            )

        # Giới hạn số lượng thành viên dựa trên max_team_members của hackathon
        if len(team.member_ids) >= hackathon.max_team_members:
            raise AppException(
                f"Đội thi đã đạt số lượng thành viên tối đa ({hackathon.max_team_members} người)",
                400,
            )

        if user_id not in team.member_ids:
            new_members = list(team.member_ids)
            new_members.append(user_id)
            team.member_ids = new_members
            await self._team_repo.update(team)

        members_info = [
            await self._user_service.get_user_info(mid) for mid in team.member_ids
        ]

        return HackathonTeamOutDTO(
            id=team.id,
            hackathon_id=team.hackathon_id,
            name=team.name,
            code=team.code,
            leader_id=team.leader_id,
            member_ids=team.member_ids,
            members=members_info,
            created_at=team.created_at,
        )
