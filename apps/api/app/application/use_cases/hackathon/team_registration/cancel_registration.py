from datetime import datetime
from uuid import UUID

from app.domain.exceptions.exceptions import AppException
from app.domain.entities.hackathon import RegistrationStatus
from app.domain.interfaces import (
    IHackathonRegistrationRepository,
    IHackathonRepository,
)


class CancelRegistrationUseCase:
    def __init__(
        self,
        hackathon_repo: IHackathonRepository,
        reg_repo: IHackathonRegistrationRepository,
    ) -> None:
        self._hackathon_repo = hackathon_repo
        self._reg_repo = reg_repo

    async def __call__(self, hackathon_id: UUID, user_id: int) -> None:
        hackathon = await self._hackathon_repo.get(hackathon_id)
        if not hackathon:
            raise AppException("Hackathon không tồn tại", 404)

        if hackathon.start_time and datetime.now() > hackathon.start_time:
            raise AppException("Không thể hủy đăng ký sau khi đã hết hạn đăng ký", 400)

        reg = await self._reg_repo.get_user_registration(hackathon_id, user_id)
        if not reg:
            raise AppException("Bạn chưa đăng ký cá nhân tham gia hackathon này", 400)

        # Cho phép hủy cả đơn REJECTED (để user có thể dọn sạch và đăng ký lại)
        if reg.status == RegistrationStatus.APPROVED:
            raise AppException("Không thể hủy đăng ký đã được phê duyệt", 400)

        reg.status = RegistrationStatus.CANCELLED
        await self._reg_repo.update(reg)
