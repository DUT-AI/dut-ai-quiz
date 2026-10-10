from datetime import datetime
from uuid import UUID

from app.presentation.schemas.questions import QuestionOptionIn
from pydantic import BaseModel, Field


class ParsedQuestionPreview(BaseModel):
    content: str
    options: list[QuestionOptionIn] = Field(default_factory=list)
    solution: str | None = None
    confidence: float = 1.0  # Static for now since not using AI


class PDFParseResponse(BaseModel):
    questions: list[ParsedQuestionPreview]
    total_pages: int
    warnings: list[str] = Field(default_factory=list)


class PDFImportRequest(BaseModel):
    question_delimiter: str = r"Câu \d+[:.]"
    option_prefixes: str = "A,B,C,D"
    correct_answer_marker: str = ""  # e.g. "*" or "Đáp án: "


class StartPdfImportResponse(BaseModel):
    job_id: UUID
    status: str
    message: str


class ImportSessionStatusResponse(BaseModel):
    id: UUID
    user_id: int
    target_scope: str | None
    status: str
    error_message: str | None
    created_at: datetime
    updated_at: datetime | None
