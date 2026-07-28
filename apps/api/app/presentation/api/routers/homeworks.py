from datetime import datetime
from dataclasses import asdict
from typing import Annotated
from uuid import UUID

from dishka.integrations.fastapi import FromDishka, inject
from fastapi import APIRouter, File, Form, UploadFile

from app.application.use_cases.homeworks import HomeworkUseCases
from app.domain.entities.homework import HomeworkEntity, HomeworkSubmissionEntity
from app.domain.exceptions.exceptions import AppException
from app.domain.interfaces import IManageService
from app.presentation.api.deps import AdminOrMentorUser, CurrentUser
from app.presentation.schemas.homeworks import (
    DownloadUrlResponse,
    HomeworkListResponse,
    HomeworkOut,
    HomeworkResponse,
    HomeworkSubmissionOut,
    SubmissionListResponse,
    SubmissionResponse,
)

router = APIRouter(prefix="/homeworks", tags=["homeworks"])


def _ensure_manage_user(user: CurrentUser) -> None:
    if user.identity_source != "service_a":
        raise AppException("Chỉ tài khoản DUT Manager được sử dụng bài tập", 403)


def _submission_out(
    submission: HomeworkSubmissionEntity,
    names: dict[int, tuple[str, str | None]] | None = None,
) -> HomeworkSubmissionOut:
    profile = (names or {}).get(submission.user_id)
    return HomeworkSubmissionOut(
        **asdict(submission),
        owner_name=profile[0] if profile else None,
        owner_avatar_url=profile[1] if profile else None,
    )


async def _homework_out(
    use_case: HomeworkUseCases,
    homework: HomeworkEntity,
    current_submission: HomeworkSubmissionEntity | None = None,
) -> HomeworkOut:
    assert homework.id is not None
    submissions = await use_case.submissions(homework.id)
    return HomeworkOut(
        id=homework.id,
        lesson_id=homework.lesson_id,
        title=homework.title,
        description=homework.description,
        deadline=homework.deadline,
        created_by=homework.created_by,
        created_at=homework.created_at,
        updated_at=homework.updated_at,
        has_attachment=bool(homework.attachment_key),
        assignee_ids=homework.assignee_ids,
        assignment_count=len(homework.assignee_ids),
        submitted_count=len({item.user_id for item in submissions}),
        current_submission=(
            _submission_out(current_submission) if current_submission else None
        ),
    )


@router.get("/me", response_model=HomeworkListResponse)
@inject
async def list_my_homeworks(
    user: CurrentUser,
    use_case: FromDishka[HomeworkUseCases],
    lesson_id: UUID | None = None,
):
    _ensure_manage_user(user)
    rows = await use_case.list_for_user(user.id, lesson_id=lesson_id)
    return HomeworkListResponse(
        data=[
            await _homework_out(use_case, homework, submission)
            for homework, submission in rows
        ]
    )


@router.get("", response_model=HomeworkListResponse)
@inject
async def list_homeworks(
    user: AdminOrMentorUser,
    use_case: FromDishka[HomeworkUseCases],
    lesson_id: UUID | None = None,
):
    _ensure_manage_user(user)
    return HomeworkListResponse(
        data=[
            await _homework_out(use_case, homework)
            for homework in await use_case.list_all(lesson_id=lesson_id)
        ]
    )


@router.post("", response_model=HomeworkResponse)
@inject
async def create_homework(
    user: AdminOrMentorUser,
    use_case: FromDishka[HomeworkUseCases],
    title: Annotated[str, Form()],
    deadline: Annotated[datetime, Form()],
    lesson_id: Annotated[UUID, Form()],
    description: Annotated[str, Form()] = "",
    assignee_ids: Annotated[list[int] | None, Form()] = None,
    team_ids: Annotated[list[int] | None, Form()] = None,
    file: Annotated[UploadFile | None, File()] = None,
):
    _ensure_manage_user(user)
    homework = await use_case.create(
        lesson_id=lesson_id,
        title=title,
        description=description,
        deadline=deadline.replace(tzinfo=None),
        created_by=user.id,
        assignee_ids=assignee_ids or [],
        team_ids=team_ids or [],
        file=file,
    )
    return HomeworkResponse(data=await _homework_out(use_case, homework))


@router.patch("/{homework_id}", response_model=HomeworkResponse)
@inject
async def update_homework(
    homework_id: UUID,
    user: AdminOrMentorUser,
    use_case: FromDishka[HomeworkUseCases],
    title: Annotated[str | None, Form()] = None,
    deadline: Annotated[datetime | None, Form()] = None,
    lesson_id: Annotated[UUID | None, Form()] = None,
    description: Annotated[str | None, Form()] = None,
    assignee_ids: Annotated[list[int] | None, Form()] = None,
    team_ids: Annotated[list[int] | None, Form()] = None,
    file: Annotated[UploadFile | None, File()] = None,
):
    _ensure_manage_user(user)
    homework = await use_case.update(
        homework_id,
        lesson_id=lesson_id,
        title=title,
        description=description,
        deadline=deadline.replace(tzinfo=None) if deadline else None,
        assignee_ids=assignee_ids,
        team_ids=team_ids,
        file=file,
    )
    return HomeworkResponse(data=await _homework_out(use_case, homework))


@router.delete("/{homework_id}")
@inject
async def archive_homework(
    homework_id: UUID,
    user: AdminOrMentorUser,
    use_case: FromDishka[HomeworkUseCases],
):
    _ensure_manage_user(user)
    await use_case.archive(homework_id)
    return {"is_success": True}


@router.post("/{homework_id}/submissions", response_model=SubmissionResponse)
@inject
async def submit_homework(
    homework_id: UUID,
    user: CurrentUser,
    use_case: FromDishka[HomeworkUseCases],
    file: Annotated[UploadFile, File()],
):
    _ensure_manage_user(user)
    return SubmissionResponse(data=_submission_out(await use_case.submit(homework_id, user.id, file)))


@router.get("/{homework_id}/submission/me", response_model=SubmissionResponse)
@inject
async def get_my_submission(
    homework_id: UUID,
    user: CurrentUser,
    use_case: FromDishka[HomeworkUseCases],
):
    _ensure_manage_user(user)
    submission = await use_case.latest_submission(homework_id, user.id)
    return SubmissionResponse(
        data=_submission_out(submission) if submission else None
    )


@router.get("/{homework_id}/submissions", response_model=SubmissionListResponse)
@inject
async def list_submissions(
    homework_id: UUID,
    user: AdminOrMentorUser,
    use_case: FromDishka[HomeworkUseCases],
    manage_service: FromDishka[IManageService],
):
    _ensure_manage_user(user)
    profiles = {
        profile.user_id: (profile.user_name, profile.user_avatar_url)
        for profile in await manage_service.get_users()
    }
    return SubmissionListResponse(
        data=[
            _submission_out(submission, profiles)
            for submission in await use_case.submissions(homework_id)
        ]
    )


@router.get("/{homework_id}/unsubmitted")
@inject
async def list_unsubmitted(
    homework_id: UUID,
    user: AdminOrMentorUser,
    use_case: FromDishka[HomeworkUseCases],
):
    _ensure_manage_user(user)
    return {"data": await use_case.unsubmitted(homework_id), "is_success": True}


@router.get("/{homework_id}/attachment-url", response_model=DownloadUrlResponse)
@inject
async def homework_attachment_url(
    homework_id: UUID,
    user: CurrentUser,
    use_case: FromDishka[HomeworkUseCases],
):
    _ensure_manage_user(user)
    homework = await use_case.get(homework_id)
    if user.quiz_role not in {"admin", "MENTOR"} and user.id not in homework.assignee_ids:
        raise AppException("Bạn không được truy cập bài tập này", 403)
    if not homework.attachment_key:
        raise AppException("Bài tập không có file đính kèm", 404)
    return DownloadUrlResponse(
        data={"url": await use_case.download_url(homework.attachment_key)}
    )


@router.get("/submissions/{submission_id}/download-url", response_model=DownloadUrlResponse)
@inject
async def submission_download_url(
    submission_id: UUID,
    user: CurrentUser,
    use_case: FromDishka[HomeworkUseCases],
):
    _ensure_manage_user(user)
    submission = await use_case.get_submission(submission_id)
    if user.quiz_role not in {"admin", "MENTOR"} and submission.user_id != user.id:
        raise AppException("Bạn không được truy cập bài nộp này", 403)
    return DownloadUrlResponse(
        data={"url": await use_case.download_url(submission.object_key)}
    )
