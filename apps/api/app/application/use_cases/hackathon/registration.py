import random
import string
from datetime import datetime
from uuid import UUID, uuid4

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

    async def __call__(self, hackathon_id: UUID, user_id: int) -> HackathonRegistrationEntity:
        hackathon = await self._hackathon_repo.get(hackathon_id)
        if not hackathon:
            raise ValueError("Hackathon không tồn tại")

        if hackathon.participation_mode == ParticipationMode.TEAM:
            raise ValueError("Hackathon này chỉ chấp nhận đăng ký theo Đội nhóm")

        if hackathon.start_time and datetime.now() > hackathon.start_time:
            raise ValueError("Thời hạn đăng ký đã kết thúc")

        # Kiểm tra xem đã trong đội thi nào chưa
        user_team = await self._team_repo.get_user_team(hackathon_id, user_id)
        if user_team:
            raise ValueError("Bạn đã tham gia một đội thi trong hackathon này")

        # Kiểm tra xem đã đăng ký cá nhân chưa
        existing_reg = await self._reg_repo.get_user_registration(hackathon_id, user_id)
        if existing_reg:
            if existing_reg.status == RegistrationStatus.REJECTED:
                # Cho phép đăng ký lại sau khi bị từ chối: reset về PENDING
                existing_reg.status = RegistrationStatus.PENDING
                existing_reg.rejection_reason = None
                existing_reg.reviewed_by = None
                existing_reg.registered_at = datetime.now()
                return await self._reg_repo.update_full(existing_reg)
            raise ValueError("Bạn đã đăng ký tham gia hackathon này")

        reg = HackathonRegistrationEntity(
            id=uuid4(),
            hackathon_id=hackathon_id,
            user_id=user_id,
            team_id=None,
            status=RegistrationStatus.PENDING,
            registered_at=datetime.now(),
        )
        return await self._reg_repo.add(reg)


class CreateTeamUseCase:
    def __init__(
        self,
        hackathon_repo: HackathonRepository,
        team_repo: HackathonTeamRepository,
        reg_repo: HackathonRegistrationRepository,
    ) -> None:
        self._hackathon_repo = hackathon_repo
        self._team_repo = team_repo
        self._reg_repo = reg_repo

    async def __call__(self, hackathon_id: UUID, user_id: int, team_name: str) -> HackathonTeamEntity:
        hackathon = await self._hackathon_repo.get(hackathon_id)
        if not hackathon:
            raise ValueError("Hackathon không tồn tại")

        if hackathon.participation_mode == ParticipationMode.INDIVIDUAL:
            raise ValueError("Hackathon này chỉ chấp nhận đăng ký Cá nhân")

        if hackathon.start_time and datetime.now() > hackathon.start_time:
            raise ValueError("Thời hạn đăng ký đã kết thúc")

        if not team_name.strip():
            raise ValueError("Tên đội không được để trống")

        # Kiểm tra trùng tên đội
        name_exists = await self._team_repo.exists_name(hackathon_id, team_name.strip())
        if name_exists:
            raise ValueError("Tên đội thi này đã tồn tại trong hackathon")

        # Kiểm tra xem user đã ở đội khác chưa
        user_team = await self._team_repo.get_user_team(hackathon_id, user_id)
        if user_team:
            raise ValueError("Bạn đã tham gia một đội thi khác trong hackathon này")

        # Kiểm tra xem user đã đăng ký cá nhân chưa
        existing_reg = await self._reg_repo.get_user_registration(hackathon_id, user_id)
        if existing_reg:
            raise ValueError("Bạn đã đăng ký tham gia hackathon này với tư cách cá nhân")

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

        return saved_team


class JoinTeamUseCase:
    def __init__(
        self,
        hackathon_repo: HackathonRepository,
        team_repo: HackathonTeamRepository,
        reg_repo: HackathonRegistrationRepository,
    ) -> None:
        self._hackathon_repo = hackathon_repo
        self._team_repo = team_repo
        self._reg_repo = reg_repo

    async def __call__(self, user_id: int, code: str) -> HackathonTeamEntity:
        team = await self._team_repo.get_by_code(code.strip().upper())
        if not team:
            raise ValueError("Mã đội thi không chính xác")

        hackathon = await self._hackathon_repo.get(team.hackathon_id)
        if not hackathon:
            raise ValueError("Hackathon không tồn tại")

        if hackathon.start_time and datetime.now() > hackathon.start_time:
            raise ValueError("Thời hạn đăng ký đã kết thúc")

        # Kiểm tra xem user đã ở đội khác chưa
        user_team = await self._team_repo.get_user_team(team.hackathon_id, user_id)
        if user_team:
            raise ValueError("Bạn đã tham gia một đội thi trong hackathon này")

        # Kiểm tra xem user đã đăng ký cá nhân chưa
        existing_reg = await self._reg_repo.get_user_registration(team.hackathon_id, user_id)
        if existing_reg:
            raise ValueError("Bạn đã đăng ký tham gia hackathon này với tư cách cá nhân")

        # Giới hạn số lượng thành viên dựa trên max_team_members của hackathon
        if len(team.member_ids) >= hackathon.max_team_members:
            raise ValueError(f"Đội thi đã đạt số lượng thành viên tối đa ({hackathon.max_team_members} người)")

        if user_id not in team.member_ids:
            new_members = list(team.member_ids)
            new_members.append(user_id)
            team.member_ids = new_members
            await self._team_repo.update(team)

        return team


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

    async def __call__(self, hackathon_id: UUID, user_id: int, new_leader_id: int | None = None) -> None:
        hackathon = await self._hackathon_repo.get(hackathon_id)
        if not hackathon:
            raise ValueError("Hackathon không tồn tại")

        if hackathon.start_time and datetime.now() > hackathon.start_time:
            raise ValueError("Không thể rời đội sau khi đã hết hạn đăng ký")

        team = await self._team_repo.get_user_team(hackathon_id, user_id)
        if not team:
            raise ValueError("Bạn không thuộc đội thi nào trong hackathon này")

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
                    raise ValueError("Bạn là trưởng nhóm. Hãy chỉ định một trưởng nhóm mới trước khi rời đội.")
                if new_leader_id not in other_members:
                    raise ValueError("Trưởng nhóm mới được chỉ định phải thuộc thành viên của đội.")
                
                team.leader_id = new_leader_id
                team.member_ids = other_members
                await self._team_repo.update(team)
        else:
            # Thành viên bình thường rời đội
            team.member_ids = [m for m in team.member_ids if m != user_id]
            await self._team_repo.update(team)


class CancelRegistrationUseCase:
    def __init__(
        self,
        hackathon_repo: HackathonRepository,
        reg_repo: HackathonRegistrationRepository,
    ) -> None:
        self._hackathon_repo = hackathon_repo
        self._reg_repo = reg_repo

    async def __call__(self, hackathon_id: UUID, user_id: int) -> None:
        hackathon = await self._hackathon_repo.get(hackathon_id)
        if not hackathon:
            raise ValueError("Hackathon không tồn tại")

        if hackathon.start_time and datetime.now() > hackathon.start_time:
            raise ValueError("Không thể hủy đăng ký sau khi đã hết hạn đăng ký")

        reg = await self._reg_repo.get_user_registration(hackathon_id, user_id)
        if not reg:
            raise ValueError("Bạn chưa đăng ký cá nhân tham gia hackathon này")

        # Cho phép hủy cả đơn REJECTED (để user có thể dọn sạch và đăng ký lại)
        if reg.status == RegistrationStatus.APPROVED:
            raise ValueError("Không thể hủy đăng ký đã được phê duyệt")

        reg.status = RegistrationStatus.CANCELLED
        await self._reg_repo.update(reg)


class ListRegistrationsUseCase:
    def __init__(
        self,
        hackathon_repo: HackathonRepository,
        reg_repo: HackathonRegistrationRepository,
    ) -> None:
        self._hackathon_repo = hackathon_repo
        self._reg_repo = reg_repo

    async def __call__(self, hackathon_id: UUID, user_id: int) -> list[HackathonRegistrationEntity]:
        hackathon = await self._hackathon_repo.get(hackathon_id)
        if not hackathon:
            raise ValueError("Hackathon không tồn tại")

        if hackathon.created_by != user_id:
            raise ValueError("Bạn không có quyền quản lý giải đấu này")

        return await self._reg_repo.list_for_hackathon(hackathon_id)


class ReviewRegistrationUseCase:
    def __init__(
        self,
        hackathon_repo: HackathonRepository,
        reg_repo: HackathonRegistrationRepository,
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
            raise ValueError("Đơn đăng ký không tồn tại")

        hackathon = await self._hackathon_repo.get(reg.hackathon_id)
        if not hackathon:
            raise ValueError("Hackathon không tồn tại")

        if hackathon.created_by != reviewer_id:
            raise ValueError("Bạn không có quyền duyệt đăng ký cho giải đấu này")

        if status not in (RegistrationStatus.APPROVED, RegistrationStatus.REJECTED):
            raise ValueError("Trạng thái duyệt không hợp lệ")

        reg.status = status
        reg.reviewed_by = reviewer_id
        if status == RegistrationStatus.REJECTED:
            reg.rejection_reason = rejection_reason
        else:
            reg.rejection_reason = None

        return await self._reg_repo.update(reg)
