from uuid import UUID

from app.application.dtos import (
    HackathonRegistrationOutDTO,
    HackathonRegistrationStatusOutDTO,
    HackathonTeamOutDTO,
)
from app.application.services.user_service import UserService
from app.domain.interfaces import (
    IHackathonRegistrationRepository,
    IHackathonTeamRepository,
)


class GetRegistrationStatusUseCase:
    def __init__(
        self,
        reg_repo: IHackathonRegistrationRepository,
        team_repo: IHackathonTeamRepository,
        user_service: UserService,
    ) -> None:
        self._reg_repo = reg_repo
        self._team_repo = team_repo
        self._user_service = user_service

    async def __call__(self, hackathon_id: UUID, user_id: int) -> HackathonRegistrationStatusOutDTO:
        reg = await self._reg_repo.get_user_registration(hackathon_id, user_id)
        team = await self._team_repo.get_user_team(hackathon_id, user_id)

        if not reg and team:
            reg = await self._reg_repo.get_team_registration(hackathon_id, team.id)

        team_dto = None
        if team:
            members_info = [await self._user_service.get_user_info(mid) for mid in team.member_ids]
            team_dto = HackathonTeamOutDTO(
                id=team.id,
                hackathon_id=team.hackathon_id,
                name=team.name,
                code=team.code,
                leader_id=team.leader_id,
                member_ids=team.member_ids,
                members=members_info,
                created_at=team.created_at,
            )

        reg_dto = None
        if reg:
            user_dto = None
            if reg.user_id:
                user_dto = await self._user_service.get_user_info(reg.user_id)

            team_dto_for_reg = None
            if reg.team_id:
                if team_dto and team_dto.id == reg.team_id:
                    team_dto_for_reg = team_dto
                else:
                    t = await self._team_repo.get(reg.team_id)
                    if t:
                        team_members = [
                            await self._user_service.get_user_info(mid) for mid in t.member_ids
                        ]
                        team_dto_for_reg = HackathonTeamOutDTO(
                            id=t.id,
                            hackathon_id=t.hackathon_id,
                            name=t.name,
                            code=t.code,
                            leader_id=t.leader_id,
                            member_ids=t.member_ids,
                            members=team_members,
                            created_at=t.created_at,
                        )

            reg_dto = HackathonRegistrationOutDTO(
                id=reg.id,
                hackathon_id=reg.hackathon_id,
                user_id=reg.user_id,
                team_id=reg.team_id,
                status=reg.status,
                registered_at=reg.registered_at,
                reviewed_by=reg.reviewed_by,
                rejection_reason=reg.rejection_reason,
                team=team_dto_for_reg,
                user=user_dto,
            )

        return HackathonRegistrationStatusOutDTO(
            is_registered=reg is not None,
            registration=reg_dto,
            team=team_dto,
        )
