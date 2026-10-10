from typing import Annotated
from uuid import UUID

from dishka.integrations.fastapi import FromDishka, inject
from fastapi import APIRouter, Depends, HTTPException

from app.application.services.auth_roles import quiz_role_from_manage
from app.application.use_cases.hackathon import (
    CreateHackathonUseCase,
    DeleteHackathonUseCase,
    GetHackathonUseCase,
    ListHackathonsUseCase,
    UpdateHackathonUseCase,
)
from app.domain.entities.auth_enums import SystemPermission
from app.presentation.api.deps import CurrentUser, RequirePermissions, UserContext
from app.presentation.schemas.hackathons import (
    HackathonCreate,
    HackathonOut,
    HackathonUpdate,
)

router = APIRouter(prefix="/hackathons", tags=["hackathons"])


@router.get("", response_model=list[HackathonOut])
@inject
async def list_hackathons_route(user: CurrentUser, use_case: FromDishka[ListHackathonsUseCase]):
    return await use_case.execute(user.id, quiz_role_from_manage(user.roles))


@router.post("", response_model=HackathonOut)
@inject
async def create_hackathon_route(
    user: Annotated[
        UserContext,
        Depends(RequirePermissions([SystemPermission.MANAGE_HACKATHON])),
    ],
    body: HackathonCreate,
    use_case: FromDishka[CreateHackathonUseCase],
):
    """
    RBAC: Requires MANAGE_HACKATHON permission (Project Developer / Admin).
    """
    return await use_case.execute(body, user.id)


@router.get("/{hackathon_id}", response_model=HackathonOut)
@inject
async def get_hackathon_route(
    user: CurrentUser,
    hackathon_id: UUID,
    use_case: FromDishka[GetHackathonUseCase],
):
    res = await use_case.execute(hackathon_id, user.id, quiz_role_from_manage(user.roles))
    if not res:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    return res


@router.put("/{hackathon_id}", response_model=HackathonOut)
@inject
async def update_hackathon_full_route(
    hackathon_id: UUID,
    body: HackathonUpdate,
    user: Annotated[
        UserContext,
        Depends(RequirePermissions([SystemPermission.MANAGE_HACKATHON])),
    ],
    use_case: FromDishka[UpdateHackathonUseCase],
):
    """
    Hybrid RBAC + ABAC Integration:
    1. RBAC (Dependency): Validates user has MANAGE_HACKATHON permission (or ADMIN bypass).
    2. ABAC (Ownership): Ensures only the creator (hackathon.created_by == user.id)
       or an ADMIN can update this hackathon.
    """
    res = await use_case.execute(
        hackathon_id,
        body,
        user_id=user.id,
        is_admin=user.is_admin(),
    )
    if not res:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    return res


@router.patch("/{hackathon_id}", response_model=HackathonOut)
@inject
async def update_hackathon_route(
    hackathon_id: UUID,
    body: HackathonUpdate,
    user: Annotated[
        UserContext,
        Depends(RequirePermissions([SystemPermission.MANAGE_HACKATHON])),
    ],
    use_case: FromDishka[UpdateHackathonUseCase],
):
    """
    Hybrid RBAC + ABAC Partial Update Route.
    """
    res = await use_case.execute(
        hackathon_id,
        body,
        user_id=user.id,
        is_admin=user.is_admin(),
    )
    if not res:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    return res


@router.delete("/{hackathon_id}")
@inject
async def delete_hackathon_route(
    hackathon_id: UUID,
    user: Annotated[
        UserContext,
        Depends(RequirePermissions([SystemPermission.MANAGE_HACKATHON])),
    ],
    use_case: FromDishka[DeleteHackathonUseCase],
):
    """
    Hybrid RBAC + ABAC Delete Route.
    """
    ok = await use_case.execute(
        hackathon_id,
        user_id=user.id,
        is_admin=user.is_admin(),
    )
    if not ok:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    return {"ok": True}
