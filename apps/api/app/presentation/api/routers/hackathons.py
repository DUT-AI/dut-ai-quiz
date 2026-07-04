from uuid import UUID

from dishka.integrations.fastapi import FromDishka, inject
from fastapi import APIRouter, HTTPException

from app.application.use_cases.hackathon import (
    CreateHackathonUseCase,
    CreateHackathonTaskUseCase,
    DeleteHackathonUseCase,
    DeleteHackathonTaskUseCase,
    GetHackathonUseCase,
    GetHackathonTaskUseCase,
    ListHackathonTasksUseCase,
    ListHackathonsUseCase,
    UpdateHackathonUseCase,
    UpdateHackathonTaskUseCase,
)
from app.presentation.api.deps import AdminOrMentorUser
from app.presentation.schemas.hackathons import (
    HackathonCreate,
    HackathonOut,
    HackathonTaskCreate,
    HackathonTaskOut,
    HackathonTaskUpdate,
    HackathonUpdate,
)

router = APIRouter(prefix="/hackathons", tags=["hackathons"])


@router.get("", response_model=list[HackathonOut])
@inject
async def list_hackathons_route(
    user: AdminOrMentorUser, use_case: FromDishka[ListHackathonsUseCase]
):
    return await use_case.execute(user.id)


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
    user: AdminOrMentorUser,
    hackathon_id: UUID,
    use_case: FromDishka[GetHackathonUseCase],
):
    res = await use_case.execute(hackathon_id, user.id)
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


@router.get("/{hackathon_id}/tasks", response_model=list[HackathonTaskOut])
@inject
async def list_hackathon_tasks_route(
    user: AdminOrMentorUser,
    hackathon_id: UUID,
    use_case: FromDishka[ListHackathonTasksUseCase],
):
    rows = await use_case.execute(hackathon_id, user.id)
    if rows is None:
        raise HTTPException(status_code=404, detail="Not found")
    return rows


@router.post("/{hackathon_id}/tasks", response_model=HackathonTaskOut)
@inject
async def create_hackathon_task_route(
    user: AdminOrMentorUser,
    hackathon_id: UUID,
    body: HackathonTaskCreate,
    use_case: FromDishka[CreateHackathonTaskUseCase],
):
    try:
        res = await use_case.execute(hackathon_id, body, user.id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if not res:
        raise HTTPException(status_code=404, detail="Not found")
    return res


@router.get("/{hackathon_id}/tasks/{task_id}", response_model=HackathonTaskOut)
@inject
async def get_hackathon_task_route(
    user: AdminOrMentorUser,
    hackathon_id: UUID,
    task_id: UUID,
    use_case: FromDishka[GetHackathonTaskUseCase],
):
    res = await use_case.execute(hackathon_id, task_id, user.id)
    if not res:
        raise HTTPException(status_code=404, detail="Not found")
    return res


@router.patch("/{hackathon_id}/tasks/{task_id}", response_model=HackathonTaskOut)
@inject
async def update_hackathon_task_route(
    user: AdminOrMentorUser,
    hackathon_id: UUID,
    task_id: UUID,
    body: HackathonTaskUpdate,
    use_case: FromDishka[UpdateHackathonTaskUseCase],
):
    try:
        res = await use_case.execute(hackathon_id, task_id, body, user.id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if not res:
        raise HTTPException(status_code=404, detail="Not found")
    return res


@router.delete("/{hackathon_id}/tasks/{task_id}")
@inject
async def delete_hackathon_task_route(
    user: AdminOrMentorUser,
    hackathon_id: UUID,
    task_id: UUID,
    use_case: FromDishka[DeleteHackathonTaskUseCase],
):
    ok = await use_case.execute(hackathon_id, task_id, user.id)
    if not ok:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}
