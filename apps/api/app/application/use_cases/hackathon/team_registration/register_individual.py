from datetime import datetime
from uuid import UUID, uuid4

from app.domain.exceptions.exceptions import AppException
from app.domain.entities.hackathon import (
    HackathonRegistrationEntity,
    ParticipationMode,
    RegistrationStatus,
)
from app.infrastructure.repositories.hackathons import (
    HackathonRegistrationRepository,
    HackathonRepository,
    HackathonTeamRepository,
)


class RegisterIndividualUseCase:
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
        self, hackathon_id: UUID, user_id: int
    ) -> HackathonRegistrationEntity:
        hackathon = await self._hackathon_repo.get(hackathon_id)
        if not hackathon:
            raise AppException("Hackathon không tồn tại", 404)

        if hackathon.participation_mode == ParticipationMode.TEAM:
            raise AppException("Hackathon này chỉ chấp nhận đăng ký theo Đội nhóm", 400)

        if hackathon.start_time and datetime.now() > hackathon.start_time:
            raise AppException("Thời hạn đăng ký đã kết thúc", 400)

        # Kiểm tra xem xem đã trong đội thi nào chưa
        user_team = await self._team_repo.get_user_team(hackathon_id, user_id)
        if user_team:
            raise AppException("Bạn đã tham gia một đội thi trong hackathon này", 400)

        # Kiểm tra xem xem đã đăng ký cá nhân chưa
        existing_reg = await self._reg_repo.get_user_registration(hackathon_id, user_id)
        if existing_reg:
            if existing_reg.status == RegistrationStatus.REJECTED:
                # Cho phép đăng ký lại sau khi bị từ chối: reset về PENDING
                existing_reg.status = RegistrationStatus.PENDING
                existing_reg.rejection_reason = None
                existing_reg.reviewed_by = None
                existing_reg.registered_at = datetime.now()
                return await self._reg_repo.update_full(existing_reg)
            raise AppException("Bạn đã đăng ký tham gia hackathon này", 400)

        reg = HackathonRegistrationEntity(
            id=uuid4(),
            hackathon_id=hackathon_id,
            user_id=user_id,
            team_id=None,
            status=RegistrationStatus.PENDING,
            registered_at=datetime.now(),
        )
        return await self._reg_repo.add(reg)
