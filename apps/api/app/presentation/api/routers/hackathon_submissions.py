from uuid import UUID

from dishka.integrations.fastapi import FromDishka, inject
from fastapi import APIRouter

from app.application.use_cases.hackathon.submissions import (
    CancelSubmissionUseCase,
    GetSubmissionLogsUseCase,
    ListSubmissionsUseCase,
    PresignSubmitUseCase,
    SubmitTaskUseCase,
    ViewHackathonLeaderboardUseCase,
)
from app.presentation.api.deps import CurrentUser
from app.presentation.schemas.submissions import (
    PresignSubmitIn,
    PresignSubmitOut,
    SubmissionOut,
    SubmitTaskIn,
)

router = APIRouter(prefix="/hackathons", tags=["hackathon-submissions"])


@router.post("/tasks/{task_id}/presign-submit", response_model=PresignSubmitOut)
@inject
async def presign_submit_route(
    task_id: UUID,
    body: PresignSubmitIn,
    user: CurrentUser,
    use_case: FromDishka[PresignSubmitUseCase],
):
    return await use_case(
        task_id=task_id,
        user_id=user.id,
        script_filename=body.script_filename,
        model_filename=body.model_filename,
    )


@router.post("/tasks/{task_id}/submit", response_model=SubmissionOut)
@inject
async def submit_task_route(
    task_id: UUID,
    body: SubmitTaskIn,
    user: CurrentUser,
    use_case: FromDishka[SubmitTaskUseCase],
):
    return await use_case(
        submission_id=body.submission_id,
        task_id=task_id,
        user_id=user.id,
    )


@router.post("/submissions/{submission_id}/cancel", response_model=SubmissionOut)
@inject
async def cancel_submission_route(
    submission_id: UUID,
    user: CurrentUser,
    use_case: FromDishka[CancelSubmissionUseCase],
):
    return await use_case(submission_id=submission_id, user_id=user.id)


@router.get("/submissions/{submission_id}/logs")
@inject
async def get_submission_logs_route(
    submission_id: UUID,
    user: CurrentUser,
    use_case: FromDishka[GetSubmissionLogsUseCase],
):
    logs = await use_case(
        submission_id=submission_id, user_id=user.id, quiz_role=user.quiz_role
    )
    return {"logs": logs}


@router.get("/tasks/{task_id}/submissions", response_model=list[SubmissionOut])
@inject
async def list_submissions_route(
    task_id: UUID,
    user: CurrentUser,
    use_case: FromDishka[ListSubmissionsUseCase],
):
    return await use_case(task_id=task_id, user_id=user.id, quiz_role=user.quiz_role)


@router.get("/{hackathon_id}/leaderboard")
@inject
async def view_hackathon_leaderboard_route(
    hackathon_id: UUID,
    user: CurrentUser,
    use_case: FromDishka[ViewHackathonLeaderboardUseCase],
):
    """
    Xem bảng điểm xếp hạng của hackathon.
    """
    data = await use_case(hackathon_id)
    return {"leaderboard": data}
