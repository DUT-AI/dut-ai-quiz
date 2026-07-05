from uuid import UUID

from app.application.dtos import (
    HackathonRegistrationOutDTO,
    HackathonTeamOutDTO,
)
from app.application.services.user_service import UserService
from app.domain.exceptions.exceptions import AppException
from app.infrastructure.repositories.hackathons import (
    HackathonRegistrationRepository,
    HackathonRepository,
    HackathonTeamRepository,
)


class ListRegistrationsUseCase:
    def __init__(
        self,
        hackathon_repo: HackathonRepository,
        reg_repo: HackathonRegistrationRepository,
        team_repo: HackathonTeamRepository,
        user_service: UserService,
    ) -> None:
        self._hackathon_repo = hackathon_repo
        self._reg_repo = reg_repo
        self._team_repo = team_repo
        self._user_service = user_service

    async def __call__(
        self, hackathon_id: UUID, user_id: int
    ) -> list[HackathonRegistrationOutDTO]:
        hackathon = await self._hackathon_repo.get(hackathon_id)
        if not hackathon:
            raise AppException("Hackathon không tồn tại", 404)

        if hackathon.created_by != user_id:
            raise AppException("Bạn không có quyền quản lý giải đấu này", 403)

        regs = await self._reg_repo.list_for_hackathon(hackathon_id)
        hydrated_regs = []
        for r in regs:
            user_dto = None
            if r.user_id:
                user_dto = await self._user_service.get_user_info(r.user_id)

            team_dto = None
            if r.team_id:
                t = await self._team_repo.get(r.team_id)
                if t:
                    team_members = [
                        await self._user_service.get_user_info(m_id)
                        for m_id in t.member_ids
                    ]
                    team_dto = HackathonTeamOutDTO(
                        id=t.id,
                        hackathon_id=t.hackathon_id,
                        name=t.name,
                        code=t.code,
                        leader_id=t.leader_id,
                        member_ids=t.member_ids,
                        members=team_members,
                        created_at=t.created_at,
                    )

            hydrated_regs.append(
                HackathonRegistrationOutDTO(
                    id=r.id,
                    hackathon_id=r.hackathon_id,
                    user_id=r.user_id,
                    team_id=r.team_id,
                    status=r.status,
                    registered_at=r.registered_at,
                    reviewed_by=r.reviewed_by,
                    rejection_reason=r.rejection_reason,
                    team=team_dto,
                    user=user_dto,
                )
            )
        return hydrated_regs
