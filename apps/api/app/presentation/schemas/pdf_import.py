from uuid import UUID
from pydantic import BaseModel, Field
from app.infrastructure.persistence.models import PoolType

class ParsedQuestionPreview(BaseModel):
    content: str
    options: list[dict] = Field(default_factory=list) # {text, is_correct}
    solution: str | None = None
    confidence: float = 1.0 # Static for now since not using AI

class PDFParseResponse(BaseModel):
    questions: list[ParsedQuestionPreview]
    total_pages: int
    warnings: list[str] = Field(default_factory=list)

class PDFImportRequest(BaseModel):
    question_delimiter: str = r"Câu \d+[:.]"
    option_prefixes: str = "A,B,C,D"
    correct_answer_marker: str = "" # e.g. "*" or "Đáp án: "
