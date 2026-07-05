from fastapi import APIRouter
from dishka.integrations.fastapi import FromDishka, inject
from app.presentation.api.deps import AdminOrMentorUser
from app.domain.interfaces import IManageService
from app.presentation.schemas.external import (
    ExternalUsersResponse,
    ExternalTeamsResponse,
    ExternalUserOut,
    ExternalTeamOut,
    ExternalTeamMemberOut,
)

router = APIRouter(prefix="/external", tags=["external"])


@router.get("/teams", response_model=ExternalTeamsResponse)
@inject
async def get_external_teams(
    user: AdminOrMentorUser,
    manage_service: FromDishka[IManageService],
):
    teams = await manage_service.get_teams()
    mapped_teams = []
    for t in teams:
        mapped_members = [
            ExternalTeamMemberOut(
                user_id=m.user_id,
                username=m.user_name,
            )
            for m in t.members
        ]
        mapped_teams.append(
            ExternalTeamOut(
                id=t.id,
                team_name=t.team_name,
                member_count=t.member_count,
                members=mapped_members,
            )
        )
    return ExternalTeamsResponse(data=mapped_teams)


@router.get("/users", response_model=ExternalUsersResponse)
@inject
async def get_external_users(
    user: AdminOrMentorUser,
    manage_service: FromDishka[IManageService],
):
    users = await manage_service.get_users()
    mapped_users = [
        ExternalUserOut(
            id=u.user_id,
            username=u.user_name,
            name=u.user_name,
            email=u.email,
            avatar_url=u.user_avatar_url,
        )
        for u in users
    ]
    return ExternalUsersResponse(data=mapped_users)
