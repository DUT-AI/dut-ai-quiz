from dishka.integrations.fastapi import FromDishka, inject
from fastapi import APIRouter
from loguru import logger

from app.domain.interfaces import IManageService, IUserRepository
from app.presentation.api.deps import EducatorUser
from app.presentation.schemas.external import (
    ExternalTeamMemberOut,
    ExternalTeamOut,
    ExternalTeamsResponse,
    ExternalUserOut,
    ExternalUsersResponse,
)

router = APIRouter(prefix="/external", tags=["external"])


@router.get("/teams", response_model=ExternalTeamsResponse)
@inject
async def get_external_teams(
    user: EducatorUser,
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
    user: EducatorUser,
    manage_service: FromDishka[IManageService],
    user_repo: FromDishka[IUserRepository],
):
    user_map: dict[int, ExternalUserOut] = {}

    # 1. Get users from external Manage Service
    try:
        ext_users = await manage_service.get_users()
        for u in ext_users:
            user_map[u.user_id] = ExternalUserOut(
                id=u.user_id,
                username=u.user_name,
                name=u.user_name,
                email=u.email,
                avatar_url=u.user_avatar_url,
            )
    except Exception as e:
        logger.warning(f"Error fetching users from Manage Service: {e}")

    # 2. Merge/supplement with local DB users (e.g. Google users)
    try:
        local_users = await user_repo.list_all()
        for u in local_users:
            if u.id is None:
                continue
            display_name = u.name or u.email or f"User #{u.id}"
            if u.id not in user_map:
                user_map[u.id] = ExternalUserOut(
                    id=u.id,
                    username=display_name,
                    name=display_name,
                    email=u.email,
                    avatar_url=u.avatar_url,
                )
            else:
                # Update with more specific local info if available
                existing = user_map[u.id]
                user_map[u.id] = ExternalUserOut(
                    id=u.id,
                    username=u.name or existing.username,
                    name=u.name or existing.name,
                    email=u.email or existing.email,
                    avatar_url=u.avatar_url or existing.avatar_url,
                )
    except Exception as e:
        logger.warning(f"Error fetching local users: {e}")

    return ExternalUsersResponse(data=list(user_map.values()))
