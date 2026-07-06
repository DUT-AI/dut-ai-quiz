from uuid import UUID

from dishka.integrations.fastapi import FromDishka, inject
from fastapi import APIRouter

from app.application.use_cases.hackathon import (
    CancelRegistrationUseCase,
    CreateTeamUseCase,
    GetRegistrationStatusUseCase,
    JoinTeamUseCase,
    LeaveTeamUseCase,
    ListRegistrationsUseCase,
    RegisterIndividualUseCase,
    ReviewRegistrationUseCase,
)
from app.presentation.api.deps import AdminOrMentorUser, CurrentUser
from app.presentation.schemas.hackathons import (
    HackathonRegistrationOut,
    HackathonTeamCreate,
    HackathonTeamOut,
    JoinTeamInput,
    LeaveTeamInput,
    ReviewRegistrationInput,
)

router = APIRouter(prefix="/hackathons", tags=["hackathons"])


@router.post(
    "/{hackathon_id}/register/individual", response_model=HackathonRegistrationOut
)
@inject
async def register_individual_route(
    user: CurrentUser,
    hackathon_id: UUID,
    use_case: FromDishka[RegisterIndividualUseCase],
):
    return await use_case(hackathon_id, user.id)


@router.post("/{hackathon_id}/register/team/create", response_model=HackathonTeamOut)
@inject
async def create_team_route(
    user: CurrentUser,
    hackathon_id: UUID,
    body: HackathonTeamCreate,
    use_case: FromDishka[CreateTeamUseCase],
):
    return await use_case(hackathon_id, user.id, body.name)


@router.post("/{hackathon_id}/register/team/join", response_model=HackathonTeamOut)
@inject
async def join_team_route(
    user: CurrentUser,
    hackathon_id: UUID,
    body: JoinTeamInput,
    use_case: FromDishka[JoinTeamUseCase],
):
    return await use_case(hackathon_id, user.id, body.code)


@router.post("/{hackathon_id}/register/team/leave")
@inject
async def leave_team_route(
    user: CurrentUser,
    hackathon_id: UUID,
    body: LeaveTeamInput,
    use_case: FromDishka[LeaveTeamUseCase],
):
    await use_case(hackathon_id, user.id, body.new_leader_id)
    return {"ok": True}


@router.delete("/{hackathon_id}/register/cancel")
@inject
async def cancel_registration_route(
    user: CurrentUser,
    hackathon_id: UUID,
    use_case: FromDishka[CancelRegistrationUseCase],
):
    await use_case(hackathon_id, user.id)
    return {"ok": True}


@router.get("/{hackathon_id}/registration/status")
@inject
async def get_registration_status_route(
    user: CurrentUser,
    hackathon_id: UUID,
    use_case: FromDishka[GetRegistrationStatusUseCase],
):
    return await use_case(hackathon_id, user.id)


@router.get(
    "/{hackathon_id}/registrations", response_model=list[HackathonRegistrationOut]
)
@inject
async def list_registrations_route(
    user: AdminOrMentorUser,
    hackathon_id: UUID,
    use_case: FromDishka[ListRegistrationsUseCase],
):
    return await use_case(hackathon_id, user.id)


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
    return await use_case(reg_id, body.status, user.id, body.rejection_reason)
