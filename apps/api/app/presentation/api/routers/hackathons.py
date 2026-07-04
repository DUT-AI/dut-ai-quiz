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
    RegisterIndividualUseCase,
    CreateTeamUseCase,
    JoinTeamUseCase,
    LeaveTeamUseCase,
    CancelRegistrationUseCase,
    ListRegistrationsUseCase,
    ReviewRegistrationUseCase,
)
from app.domain.interfaces import IUserRepository, IManageService
from app.infrastructure.repositories.hackathons import (
    HackathonRegistrationRepository,
    HackathonTeamRepository,
)
from app.presentation.api.deps import AdminOrMentorUser, CurrentUser
from app.presentation.schemas.hackathons import (
    HackathonCreate,
    HackathonOut,
    HackathonTaskCreate,
    HackathonTaskOut,
    HackathonTaskUpdate,
    HackathonUpdate,
    HackathonRegistrationOut,
    HackathonTeamOut,
    HackathonTeamCreate,
    JoinTeamInput,
    LeaveTeamInput,
    ReviewRegistrationInput,
)

router = APIRouter(prefix="/hackathons", tags=["hackathons"])


async def get_user_info(
    user_id: int,
    user_repo: IUserRepository,
    manage_client: IManageService,
) -> dict:
    """Lấy thông tin user từ local DB (Google) hoặc Manage Service (Service-A)."""
    u = await user_repo.get_by_id(user_id)
    if u:
        return {"id": u.id, "name": u.name or u.email, "email": u.email}

    # Fallback: lấy từ Manage Service
    profile = await manage_client.get_profile(user_id)
    if profile:
        data = profile.get("data") or profile
        return {
            "id": user_id,
            "name": data.get("name")
            or data.get("full_name")
            or f"Thành viên #{user_id}",
            "email": data.get("email") or data.get("username") or f"ID: {user_id}",
        }

    return {"id": user_id, "name": f"Thành viên #{user_id}", "email": f"ID: {user_id}"}


@router.get("", response_model=list[HackathonOut])
@inject
async def list_hackathons_route(
    user: CurrentUser, use_case: FromDishka[ListHackathonsUseCase]
):
    return await use_case.execute(user.id, user.quiz_role)


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
    user: CurrentUser,
    hackathon_id: UUID,
    use_case: FromDishka[GetHackathonUseCase],
):
    res = await use_case.execute(hackathon_id, user.id, user.quiz_role)
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
    user: CurrentUser,
    hackathon_id: UUID,
    use_case: FromDishka[ListHackathonTasksUseCase],
):
    rows = await use_case.execute(hackathon_id, user.id, user.quiz_role)
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
    user: CurrentUser,
    hackathon_id: UUID,
    task_id: UUID,
    use_case: FromDishka[GetHackathonTaskUseCase],
):
    res = await use_case.execute(hackathon_id, task_id, user.id, user.quiz_role)
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


# --- HACKATHON REGISTRATION & TEAM ENDPOINTS ---


@router.post(
    "/{hackathon_id}/register/individual", response_model=HackathonRegistrationOut
)
@inject
async def register_individual_route(
    user: CurrentUser,
    hackathon_id: UUID,
    use_case: FromDishka[RegisterIndividualUseCase],
):
    try:
        return await use_case(hackathon_id, user.id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/{hackathon_id}/register/team/create", response_model=HackathonTeamOut)
@inject
async def create_team_route(
    user: CurrentUser,
    hackathon_id: UUID,
    body: HackathonTeamCreate,
    use_case: FromDishka[CreateTeamUseCase],
    user_repo: FromDishka[IUserRepository],
    manage_client: FromDishka[IManageService],
):
    try:
        team = await use_case(hackathon_id, user.id, body.name)
        members_info = [
            await get_user_info(mid, user_repo, manage_client)
            for mid in team.member_ids
        ]
        return {
            "id": team.id,
            "hackathon_id": team.hackathon_id,
            "name": team.name,
            "code": team.code,
            "leader_id": team.leader_id,
            "member_ids": team.member_ids,
            "members": members_info,
            "created_at": team.created_at,
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/register/team/join", response_model=HackathonTeamOut)
@inject
async def join_team_route(
    user: CurrentUser,
    body: JoinTeamInput,
    use_case: FromDishka[JoinTeamUseCase],
    user_repo: FromDishka[IUserRepository],
    manage_client: FromDishka[IManageService],
):
    try:
        team = await use_case(user.id, body.code)
        members_info = [
            await get_user_info(mid, user_repo, manage_client)
            for mid in team.member_ids
        ]
        return {
            "id": team.id,
            "hackathon_id": team.hackathon_id,
            "name": team.name,
            "code": team.code,
            "leader_id": team.leader_id,
            "member_ids": team.member_ids,
            "members": members_info,
            "created_at": team.created_at,
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/{hackathon_id}/register/team/leave")
@inject
async def leave_team_route(
    user: CurrentUser,
    hackathon_id: UUID,
    body: LeaveTeamInput,
    use_case: FromDishka[LeaveTeamUseCase],
):
    try:
        await use_case(hackathon_id, user.id, body.new_leader_id)
        return {"ok": True}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.delete("/{hackathon_id}/register/cancel")
@inject
async def cancel_registration_route(
    user: CurrentUser,
    hackathon_id: UUID,
    use_case: FromDishka[CancelRegistrationUseCase],
):
    try:
        await use_case(hackathon_id, user.id)
        return {"ok": True}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/{hackathon_id}/registration/status")
@inject
async def get_registration_status_route(
    user: CurrentUser,
    hackathon_id: UUID,
    reg_repo: FromDishka[HackathonRegistrationRepository],
    team_repo: FromDishka[HackathonTeamRepository],
    user_repo: FromDishka[IUserRepository],
    manage_client: FromDishka[IManageService],
):
    reg = await reg_repo.get_user_registration(hackathon_id, user.id)
    team = await team_repo.get_user_team(hackathon_id, user.id)

    if not reg and team:
        reg = await reg_repo.get_team_registration(hackathon_id, team.id)

    team_data = None
    if team:
        members_info = [
            await get_user_info(mid, user_repo, manage_client)
            for mid in team.member_ids
        ]
        team_data = {
            "id": team.id,
            "hackathon_id": team.hackathon_id,
            "name": team.name,
            "code": team.code,
            "leader_id": team.leader_id,
            "member_ids": team.member_ids,
            "members": members_info,
            "created_at": team.created_at,
        }

    return {"is_registered": reg is not None, "registration": reg, "team": team_data}


@router.get(
    "/{hackathon_id}/registrations", response_model=list[HackathonRegistrationOut]
)
@inject
async def list_registrations_route(
    user: AdminOrMentorUser,
    hackathon_id: UUID,
    use_case: FromDishka[ListRegistrationsUseCase],
    user_repo: FromDishka[IUserRepository],
    team_repo: FromDishka[HackathonTeamRepository],
    manage_client: FromDishka[IManageService],
):
    try:
        regs = await use_case(hackathon_id, user.id)
        hydrated_regs = []
        for r in regs:
            r_dict = {
                "id": r.id,
                "hackathon_id": r.hackathon_id,
                "user_id": r.user_id,
                "team_id": r.team_id,
                "status": r.status,
                "registered_at": r.registered_at,
                "reviewed_by": r.reviewed_by,
                "rejection_reason": r.rejection_reason,
                "team": None,
                "user_name": None,
                "user_email": None,
            }
            if r.user_id:
                info = await get_user_info(r.user_id, user_repo, manage_client)
                r_dict["user_name"] = info["name"]
                r_dict["user_email"] = info["email"]
            if r.team_id:
                t = await team_repo.get(r.team_id)
                if t:
                    team_members = [
                        await get_user_info(m_id, user_repo, manage_client)
                        for m_id in t.member_ids
                    ]
                    r_dict["team"] = {
                        "id": t.id,
                        "hackathon_id": t.hackathon_id,
                        "name": t.name,
                        "code": t.code,
                        "leader_id": t.leader_id,
                        "member_ids": t.member_ids,
                        "members": team_members,
                        "created_at": t.created_at,
                    }
            hydrated_regs.append(r_dict)
        return hydrated_regs
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post(
    "/{hackathon_id}/registrations/{reg_id}/review",
    response_model=HackathonRegistrationOut,
)
@inject
async def review_registration_route(
    user: AdminOrMentorUser,
    hackathon_id: UUID,
    reg_id: UUID,
    body: ReviewRegistrationInput,
    use_case: FromDishka[ReviewRegistrationUseCase],
):
    try:
        return await use_case(reg_id, body.status, user.id, body.rejection_reason)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
