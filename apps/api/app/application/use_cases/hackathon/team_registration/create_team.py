import random
import string
from datetime import datetime
from uuid import UUID, uuid4

from app.application.dtos import HackathonTeamOutDTO
from app.application.services.user_service import UserService
from app.domain.exceptions.exceptions import AppException
from app.domain.entities.hackathon import (
    HackathonRegistrationEntity,
    HackathonTeamEntity,
    ParticipationMode,
    RegistrationStatus,
)
from app.infrastructure.repositories.hackathons import (
    HackathonRegistrationRepository,
    HackathonRepository,
    HackathonTeamRepository,
)


class CreateTeamUseCase:
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
        self, hackathon_id: UUID, user_id: int, team_name: str
    ) -> HackathonTeamOutDTO:
        hackathon = await self._hackathon_repo.get(hackathon_id)
        if not hackathon:
            raise AppException("Hackathon không tồn tại", 404)

        if hackathon.participation_mode == ParticipationMode.INDIVIDUAL:
            raise AppException("Hackathon này chỉ chấp nhận đăng ký Cá nhân", 400)

        if hackathon.start_time and datetime.now() > hackathon.start_time:
            raise AppException("Thời hạn đăng ký đã kết thúc", 400)

        if not team_name.strip():
            raise AppException("Tên đội không được để trống", 400)

        # Kiểm tra trùng tên đội
        name_exists = await self._team_repo.exists_name(hackathon_id, team_name.strip())
        if name_exists:
            raise AppException("Tên đội thi này đã tồn tại trong hackathon", 400)

        # Kiểm tra xem user đã ở đội khác chưa
        user_team = await self._team_repo.get_user_team(hackathon_id, user_id)
        if user_team:
            raise AppException(
                "Bạn đã tham gia một đội thi khác trong hackathon này", 400
            )

        # Kiểm tra xem user đã đăng ký cá nhân chưa
        existing_reg = await self._reg_repo.get_user_registration(hackathon_id, user_id)
        if existing_reg:
            raise AppException(
                "Bạn đã đăng ký tham gia hackathon này với tư cách cá nhân", 400
            )

        # Sinh mã đội duy nhất dạng DUT-XXXX
        chars = string.ascii_uppercase + string.digits
        code = ""
        for _ in range(10):  # Thử tối đa 10 lần
            temp_code = "DUT-" + "".join(random.choices(chars, k=4))
            existing_team = await self._team_repo.get_by_code(temp_code)
            if not existing_team:
                code = temp_code
                break
        if not code:
            code = "DUT-" + "".join(random.choices(chars, k=4))

        team = HackathonTeamEntity(
            id=uuid4(),
            hackathon_id=hackathon_id,
            name=team_name.strip(),
            code=code,
            leader_id=user_id,
            member_ids=[user_id],
            created_at=datetime.now(),
        )
        saved_team = await self._team_repo.add(team)

        # Tạo đơn đăng ký cho đội thi
        reg = HackathonRegistrationEntity(
            id=uuid4(),
            hackathon_id=hackathon_id,
            user_id=None,
            team_id=saved_team.id,
            status=RegistrationStatus.PENDING,
            registered_at=datetime.now(),
        )
        await self._reg_repo.add(reg)

        members_info = [
            await self._user_service.get_user_info(mid) for mid in saved_team.member_ids
        ]

        return HackathonTeamOutDTO(
            id=saved_team.id,
            hackathon_id=saved_team.hackathon_id,
            name=saved_team.name,
            code=saved_team.code,
            leader_id=saved_team.leader_id,
            member_ids=saved_team.member_ids,
            members=members_info,
            created_at=saved_team.created_at,
        )
