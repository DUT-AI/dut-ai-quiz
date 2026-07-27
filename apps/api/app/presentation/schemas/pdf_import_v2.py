"""Pydantic schemas for PDF Import v2 API."""
from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel, Field


class PDFUploadResponse(BaseModel):
    """Response for successful PDF upload (202 Accepted pattern)."""
    ok: bool
    job_id: str | None = None
    status: str | None = None
    error: str | None = None
    is_encrypted: bool = False


class ImportSessionStatusResponse(BaseModel):
    """Status poll response."""
    job_id: str
    status: str  # PROCESSING | COMPLETED | FAILED
    total_questions: int
    processed_questions: int
    error_message: str | None = None
    file_name: str
    created_at: str


class DraftQuestionOptionOut(BaseModel):
    id: str
    text: str
    is_correct: bool | None
    fixed: bool = False


class DraftQuestionOut(BaseModel):
    """DRAFT question as shown in review UI."""
    id: str
    content: str
    options: list[DraftQuestionOptionOut]
    solution: str | None
    difficulty: str
    status: str
    is_answer_ai_generated: bool
    is_solution_ai_generated: bool
    is_difficulty_ai_suggested: bool
    duplicate_status: str
    duplicate_of_question_id: str | None
    review_locked_by: int | None
    lesson_id: str | None
    created_at: str


class DraftQuestionsListResponse(BaseModel):
    questions: list[DraftQuestionOut]
    total: int


class ApproveQuestionRequest(BaseModel):
    """Optional inline edits when approving."""
    content: str | None = None
    solution: str | None = None
    difficulty: str | None = None
    lesson_id: UUID | None = None


class ApproveQuestionResponse(BaseModel):
    ok: bool
    question_id: str | None = None
    status: str | None = None
    error: str | None = None


class RejectQuestionResponse(BaseModel):
    ok: bool
    question_id: str | None = None
    deleted: bool = False
    error: str | None = None


class RegenerateSolutionRequest(BaseModel):
    admin_hint: str = Field(
        default="",
        description="Gợi ý của admin để định hướng AI sinh lời giải",
    )


class RegenerateSolutionResponse(BaseModel):
    ok: bool
    question_id: str | None = None
    solution: str | None = None
    error: str | None = None


class LockResponse(BaseModel):
    ok: bool
    question_id: str | None = None
    locked_by: int | None = None
    ttl_seconds: int | None = None
    renewed: bool = False
    error: str | None = None
