from uuid import UUID

from app.domain.exceptions.exceptions import AppException
from app.domain.entities.hackathon import (
    HackathonRegistrationEntity,
    RegistrationStatus,
)
from app.domain.interfaces import (
    IHackathonRegistrationRepository,
    IHackathonRepository,
)


class ReviewRegistrationUseCase:
    def __init__(
        self,
        hackathon_repo: IHackathonRepository,
        reg_repo: IHackathonRegistrationRepository,
    ) -> None:
        self._hackathon_repo = hackathon_repo
        self._reg_repo = reg_repo

    async def __call__(
        self,
        registration_id: UUID,
        status: RegistrationStatus,
        reviewer_id: int,
        rejection_reason: str | None = None,
    ) -> HackathonRegistrationEntity:
        reg = await self._reg_repo.get(registration_id)
        if not reg:
            raise AppException("Đơn đăng ký không tồn tại", 404)

        hackathon = await self._hackathon_repo.get(reg.hackathon_id)
        if not hackathon:
            raise AppException("Hackathon không tồn tại", 404)

        if hackathon.created_by != reviewer_id:
            raise AppException("Bạn không có quyền duyệt đăng ký cho giải đấu này", 403)

        if status not in (RegistrationStatus.APPROVED, RegistrationStatus.REJECTED):
            raise AppException("Trạng thái duyệt không hợp lệ", 400)

        reg.status = status
        reg.reviewed_by = reviewer_id
        if status == RegistrationStatus.REJECTED:
            reg.rejection_reason = rejection_reason
        else:
            reg.rejection_reason = None

        return await self._reg_repo.update(reg)
