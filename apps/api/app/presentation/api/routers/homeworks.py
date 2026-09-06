from typing import Annotated
from uuid import UUID

from dishka.integrations.fastapi import FromDishka, inject
from fastapi import APIRouter, File, Form, UploadFile

from app.application.dtos.homework import (
    CreateHomeworkDTO,
    HomeworkFileDTO,
    SubmitHomeworkDTO,
    UpdateHomeworkDTO,
)
from app.application.use_cases.homeworks import (
    ArchiveHomeworkUseCase,
    CreateHomeworkUseCase,
    GetHomeworkAttachmentUrlUseCase,
    GetHomeworkSubmissionDownloadUrlUseCase,
    GetMyHomeworkSubmissionUseCase,
    ListCompletedHomeworkMembersUseCase,
    ListHomeworkSubmissionsUseCase,
    ListHomeworksUseCase,
    ListMyHomeworksUseCase,
    RetryHomeworkSubmissionUseCase,
    SubmitHomeworkUseCase,
    UpdateHomeworkUseCase,
)
from app.config import settings
from app.domain.entities.auth_enums import SystemPermission
from app.presentation.api.deps import CurrentUser, EducatorUser
from app.presentation.schemas.homeworks import (
    CompletedHomeworkMembersResponse,
    DownloadUrlData,
    DownloadUrlResponse,
    HomeworkListResponse,
    HomeworkResponse,
    SubmissionListResponse,
    SubmissionResponse,
    SuccessResponse,
)

router = APIRouter(prefix="/homeworks", tags=["homeworks"])


async def _file_dto(file: UploadFile) -> HomeworkFileDTO:
    return HomeworkFileDTO(
        filename=file.filename or "file",
        content=await file.read(settings.homework_max_file_size_bytes + 1),
    )


async def _optional_file_dto(
    file: UploadFile | None,
) -> HomeworkFileDTO | None:
    return await _file_dto(file) if file is not None else None


@router.get("/me", response_model=HomeworkListResponse)
@inject
async def list_my_homeworks(
    user: CurrentUser,
    use_case: FromDishka[ListMyHomeworksUseCase],
    lesson_id: UUID | None = None,
) -> HomeworkListResponse:
    return HomeworkListResponse(
        data=await use_case.execute(user.id, lesson_id=lesson_id)
    )


@router.get("", response_model=HomeworkListResponse)
@inject
async def list_homeworks(
    user: EducatorUser,
    use_case: FromDishka[ListHomeworksUseCase],
    lesson_id: UUID | None = None,
) -> HomeworkListResponse:
    return HomeworkListResponse(data=await use_case.execute(lesson_id=lesson_id))


@router.post("", response_model=HomeworkResponse)
@inject
async def create_homework(
    user: EducatorUser,
    use_case: FromDishka[CreateHomeworkUseCase],
    title: Annotated[str, Form()],
    lesson_id: Annotated[UUID, Form()],
    description: Annotated[str, Form()] = "",
    file: Annotated[UploadFile | None, File()] = None,
) -> HomeworkResponse:
    return HomeworkResponse(
        data=await use_case.execute(
            CreateHomeworkDTO(
                lesson_id=lesson_id,
                title=title,
                description=description,
                created_by=user.id,
                file=await _optional_file_dto(file),
            )
        )
    )


@router.patch("/{homework_id}", response_model=HomeworkResponse)
@inject
async def update_homework(
    homework_id: UUID,
    user: EducatorUser,
    use_case: FromDishka[UpdateHomeworkUseCase],
    title: Annotated[str | None, Form()] = None,
    lesson_id: Annotated[UUID | None, Form()] = None,
    description: Annotated[str | None, Form()] = None,
    file: Annotated[UploadFile | None, File()] = None,
) -> HomeworkResponse:
    return HomeworkResponse(
        data=await use_case.execute(
            homework_id,
            UpdateHomeworkDTO(
                lesson_id=lesson_id,
                title=title,
                description=description,
                file=await _optional_file_dto(file),
            ),
        )
    )


@router.delete("/{homework_id}", response_model=SuccessResponse)
@inject
async def archive_homework(
    homework_id: UUID,
    user: EducatorUser,
    use_case: FromDishka[ArchiveHomeworkUseCase],
) -> SuccessResponse:
    await use_case.execute(homework_id)
    return SuccessResponse()


@router.post(
    "/{homework_id}/submissions",
    response_model=SubmissionResponse,
)
@inject
async def submit_homework(
    homework_id: UUID,
    user: CurrentUser,
    use_case: FromDishka[SubmitHomeworkUseCase],
    file: Annotated[UploadFile, File()],
) -> SubmissionResponse:
    return SubmissionResponse(
        data=await use_case.execute(
            SubmitHomeworkDTO(
                homework_id=homework_id,
                user_id=user.id,
                file=await _file_dto(file),
            )
        )
    )


@router.post(
    "/submissions/{submission_id}/retry",
    response_model=SubmissionResponse,
)
@inject
async def retry_homework_submission(
    submission_id: UUID,
    user: CurrentUser,
    use_case: FromDishka[RetryHomeworkSubmissionUseCase],
) -> SubmissionResponse:
    return SubmissionResponse(
        data=await use_case.execute(submission_id, user.id)
    )


@router.get(
    "/{homework_id}/submission/me",
    response_model=SubmissionResponse,
)
@inject
async def get_my_submission(
    homework_id: UUID,
    user: CurrentUser,
    use_case: FromDishka[GetMyHomeworkSubmissionUseCase],
) -> SubmissionResponse:
    return SubmissionResponse(data=await use_case.execute(homework_id, user.id))


@router.get(
    "/{homework_id}/submissions",
    response_model=SubmissionListResponse,
)
@inject
async def list_submissions(
    homework_id: UUID,
    user: EducatorUser,
    use_case: FromDishka[ListHomeworkSubmissionsUseCase],
) -> SubmissionListResponse:
    return SubmissionListResponse(data=await use_case.execute(homework_id))


@router.get(
    "/{lesson_slug}/completed-members",
    response_model=CompletedHomeworkMembersResponse,
)
@inject
async def list_completed_members_for_manage(
    lesson_slug: str,
    use_case: FromDishka[ListCompletedHomeworkMembersUseCase],
) -> CompletedHomeworkMembersResponse:
    return CompletedHomeworkMembersResponse(
        data=await use_case.execute(lesson_slug)
    )


@router.get(
    "/{homework_id}/attachment-url",
    response_model=DownloadUrlResponse,
)
@inject
async def homework_attachment_url(
    homework_id: UUID,
    user: CurrentUser,
    use_case: FromDishka[GetHomeworkAttachmentUrlUseCase],
) -> DownloadUrlResponse:
    return DownloadUrlResponse(
        data=DownloadUrlData(url=await use_case.execute(homework_id))
    )


@router.get(
    "/submissions/{submission_id}/download-url",
    response_model=DownloadUrlResponse,
)
@inject
async def submission_download_url(
    submission_id: UUID,
    user: CurrentUser,
    use_case: FromDishka[GetHomeworkSubmissionDownloadUrlUseCase],
) -> DownloadUrlResponse:
    return DownloadUrlResponse(
        data=DownloadUrlData(
            url=await use_case.execute(
                submission_id,
                user.id,
                can_manage=user.has_permission(SystemPermission.MANAGE_HOMEWORK),
            )
        )
    )
