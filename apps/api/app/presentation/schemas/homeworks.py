from app.application.dtos.homework import (
    CompletedHomeworkMemberOutDTO,
    HomeworkOutDTO,
    HomeworkSubmissionOutDTO,
)
from pydantic import BaseModel


class HomeworkListResponse(BaseModel):
    data: list[HomeworkOutDTO]
    is_success: bool = True


class HomeworkResponse(BaseModel):
    data: HomeworkOutDTO
    is_success: bool = True


class SubmissionListResponse(BaseModel):
    data: list[HomeworkSubmissionOutDTO]
    is_success: bool = True


class CompletedHomeworkMembersResponse(BaseModel):
    data: list[CompletedHomeworkMemberOutDTO]
    is_success: bool = True


class SubmissionResponse(BaseModel):
    data: HomeworkSubmissionOutDTO | None
    is_success: bool = True


class DownloadUrlData(BaseModel):
    url: str


class DownloadUrlResponse(BaseModel):
    data: DownloadUrlData
    is_success: bool = True


class PresignSubmissionRequest(BaseModel):
    filename: str
    content_type: str | None = None


class PresignSubmissionData(BaseModel):
    upload_url: str
    object_key: str
    original_filename: str


class PresignSubmissionResponse(BaseModel):
    data: PresignSubmissionData
    is_success: bool = True


class SubmitHomeworkBody(BaseModel):
    object_key: str
    original_filename: str | None = None


class SuccessResponse(BaseModel):
    is_success: bool = True
