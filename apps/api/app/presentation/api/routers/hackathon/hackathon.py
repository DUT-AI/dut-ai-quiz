from __future__ import annotations

from uuid import UUID

from dishka.integrations.fastapi import FromDishka, inject
from fastapi import APIRouter, HTTPException, Query

from app.application.use_cases.hackathon.use_cases import (
    CancelSubmissionUseCase,
    CreateCompetitionPayload,
    CreateCompetitionUseCase,
    CreateSubmissionPayload,
    CreateTaskPayload,
    CreateTaskUseCase,
    GetCompetitionLeaderboardUseCase,
    ListCompetitionsUseCase,
    ListTasksUseCase,
    RecordSubmissionResultPayload,
    RecordSubmissionResultUseCase,
    SubmitHackathonSolutionUseCase,
)
from app.domain.hackathon.exceptions import (
    CompetitionNotFoundError,
    HackathonCooldownError,
    HackathonQuotaExceededError,
    SubmissionNotCancelableError,
    SubmissionNotFoundError,
    TaskNotFoundError,
)
from app.presentation.api.deps import CurrentUser, TeacherUser
from app.presentation.schemas.hackathon import (
    CompetitionCreate,
    CompetitionOut,
    LeaderboardRow,
    SubmissionCreate,
    SubmissionOut,
    SubmissionResultCreate,
    TaskCreate,
    TaskOut,
)

router = APIRouter(prefix="/hackathon", tags=["hackathon"])


def _translate_hackathon_error(exc: Exception) -> HTTPException:
    if isinstance(exc, CompetitionNotFoundError):
        return HTTPException(status_code=404, detail="Competition not found")
    if isinstance(exc, TaskNotFoundError):
        return HTTPException(status_code=404, detail="Task not found")
    if isinstance(exc, SubmissionNotFoundError):
        return HTTPException(status_code=404, detail="Submission not found")
    if isinstance(exc, HackathonCooldownError):
        return HTTPException(status_code=409, detail="Cooldown is still active")
    if isinstance(exc, HackathonQuotaExceededError):
        return HTTPException(status_code=409, detail="Submission quota exceeded")
    if isinstance(exc, SubmissionNotCancelableError):
        return HTTPException(status_code=409, detail="Submission can no longer be canceled")
    return HTTPException(status_code=400, detail=str(exc))


@router.get("/competitions", response_model=list[CompetitionOut])
@inject
async def list_competitions_route(
    use_case: FromDishka[ListCompetitionsUseCase],
):
    return await use_case.execute()


@router.post("/competitions", response_model=CompetitionOut)
@inject
async def create_competition_route(
    user: TeacherUser,
    payload: CompetitionCreate,
    use_case: FromDishka[CreateCompetitionUseCase],
):
    entity = await use_case.execute(
        CreateCompetitionPayload(**payload.model_dump()),
        created_by=user.id,
    )
    return entity


@router.get("/competitions/{competition_id}/tasks", response_model=list[TaskOut])
@inject
async def list_tasks_route(
    competition_id: UUID,
    use_case: FromDishka[ListTasksUseCase],
):
    return await use_case.execute(competition_id)


@router.post("/competitions/{competition_id}/tasks", response_model=TaskOut)
@inject
async def create_task_route(
    user: TeacherUser,
    competition_id: UUID,
    payload: TaskCreate,
    use_case: FromDishka[CreateTaskUseCase],
):
    try:
        entity = await use_case.execute(
            competition_id,
            CreateTaskPayload(**payload.model_dump()),
            created_by=user.id,
        )
        return entity
    except Exception as exc:  # pragma: no cover - translated below
        raise _translate_hackathon_error(exc) from exc


@router.post("/competitions/{competition_id}/tasks/{task_id}/submissions", response_model=SubmissionOut)
@inject
async def submit_solution_route(
    user: CurrentUser,
    competition_id: UUID,
    task_id: UUID,
    payload: SubmissionCreate,
    use_case: FromDishka[SubmitHackathonSolutionUseCase],
):
    if user.quiz_role != "student":
        raise HTTPException(status_code=403, detail="Student only")
    try:
        entity = await use_case.execute(
            competition_id=competition_id,
            task_id=task_id,
            participant_id=user.id,
            payload=CreateSubmissionPayload(**payload.model_dump()),
        )
        return entity
    except Exception as exc:  # pragma: no cover - translated below
        raise _translate_hackathon_error(exc) from exc


@router.post("/submissions/{submission_id}/cancel", response_model=SubmissionOut)
@inject
async def cancel_submission_route(
    submission_id: UUID,
    use_case: FromDishka[CancelSubmissionUseCase],
):
    try:
        return await use_case.execute(submission_id)
    except Exception as exc:  # pragma: no cover - translated below
        raise _translate_hackathon_error(exc) from exc


@router.post("/submissions/{submission_id}/result", response_model=SubmissionOut)
@inject
async def record_submission_result_route(
    user: TeacherUser,
    submission_id: UUID,
    payload: SubmissionResultCreate,
    use_case: FromDishka[RecordSubmissionResultUseCase],
):
    try:
        return await use_case.execute(submission_id, RecordSubmissionResultPayload(**payload.model_dump()))
    except Exception as exc:  # pragma: no cover - translated below
        raise _translate_hackathon_error(exc) from exc


@router.get("/competitions/{competition_id}/leaderboard", response_model=list[LeaderboardRow])
@inject
async def leaderboard_route(
    user: CurrentUser,
    competition_id: UUID,
    use_case: FromDishka[GetCompetitionLeaderboardUseCase],
    visibility: str = Query("public", pattern="^(public|private)$"),
):
    rows = await use_case.execute(competition_id)
    return rows
