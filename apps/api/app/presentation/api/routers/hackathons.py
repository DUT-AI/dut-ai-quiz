from uuid import UUID

from dishka.integrations.fastapi import FromDishka, inject
from fastapi import APIRouter, HTTPException

from app.application.use_cases.hackathon import (
    CreateHackathonUseCase,
    DeleteHackathonUseCase,
    GetHackathonUseCase,
    ListHackathonsUseCase,
    UpdateHackathonUseCase,
)
from app.presentation.api.deps import AdminOrMentorUser
from app.presentation.schemas.hackathons import (
    HackathonCreate,
    HackathonOut,
    HackathonUpdate,
)

router = APIRouter(prefix="/hackathons", tags=["hackathons"])


@router.get("", response_model=list[HackathonOut])
@inject
async def list_hackathons_route(
    use_case: FromDishka[ListHackathonsUseCase],
):
    return await use_case.execute()


@router.post("", response_model=HackathonOut)
@inject
async def create_hackathon_route(
    user: AdminOrMentorUser,
    body: HackathonCreate,
    use_case: FromDishka[CreateHackathonUseCase],
):
    return await use_case.execute(body, user.id)


@router.get("/{hackathon_id}", response_model=HackathonOut)
@inject
async def get_hackathon_route(
    hackathon_id: UUID,
    use_case: FromDishka[GetHackathonUseCase],
):
    res = await use_case.execute(hackathon_id)
    if not res:
        raise HTTPException(status_code=404, detail="Not found")
    return res


@router.patch("/{hackathon_id}", response_model=HackathonOut)
@inject
async def update_hackathon_route(
    user: AdminOrMentorUser,
    hackathon_id: UUID,
    body: HackathonUpdate,
    use_case: FromDishka[UpdateHackathonUseCase],
):
    res = await use_case.execute(hackathon_id, body, user.id)
    if not res:
        raise HTTPException(status_code=404, detail="Not found")
    return res


@router.delete("/{hackathon_id}")
@inject
async def delete_hackathon_route(
    user: AdminOrMentorUser,
    hackathon_id: UUID,
    use_case: FromDishka[DeleteHackathonUseCase],
):
    ok = await use_case.execute(hackathon_id, user.id)
    if not ok:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}