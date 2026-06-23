from pydantic import BaseModel, Field

from app.presentation.schemas.questions import QuestionOptionIn

class ParsedQuestionPreview(BaseModel):
    content: str
    options: list[QuestionOptionIn] = Field(default_factory=list)
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
