from pydantic import BaseModel

from app.application.dtos.homework import (
    HomeworkOutDTO,
    HomeworkSubmissionOutDTO,
)


class HomeworkListResponse(BaseModel):
    data: list[HomeworkOutDTO]
    is_success: bool = True


class HomeworkResponse(BaseModel):
    data: HomeworkOutDTO
    is_success: bool = True


class SubmissionListResponse(BaseModel):
    data: list[HomeworkSubmissionOutDTO]
    is_success: bool = True


class SubmissionResponse(BaseModel):
    data: HomeworkSubmissionOutDTO | None
    is_success: bool = True


class DownloadUrlData(BaseModel):
    url: str


class DownloadUrlResponse(BaseModel):
    data: DownloadUrlData
    is_success: bool = True


class UserIdListResponse(BaseModel):
    data: list[int]
    is_success: bool = True


class SuccessResponse(BaseModel):
    is_success: bool = True
