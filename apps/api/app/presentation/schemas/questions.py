import copy
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.domain.value_objects import Difficulty, PoolType


class QuestionOptionIn(BaseModel):
    id: str | None = None
    text: str
    is_correct: bool
    fixed: bool = False


class QuestionOptionOut(BaseModel):
    id: str
    text: str
    is_correct: bool | None = None
    fixed: bool

    model_config = {"from_attributes": True}


class QuestionCreate(BaseModel):
    pool_type: PoolType
    difficulty: Difficulty = Difficulty.EASY
    content: str = ""
    options: list[QuestionOptionIn] = Field(default_factory=list)
    solution: str | None = None
    lesson_id: UUID | None = None
    tags: list[UUID] = Field(default_factory=list)
    created_by: int | None = None


class QuestionUpdate(BaseModel):
    pool_type: PoolType | None = None
    difficulty: Difficulty | None = None
    content: str | None = None
    options: list[QuestionOptionIn] | None = None
    solution: str | None = None
    lesson_id: UUID | None = None
    tags: list[UUID] | None = None
    created_by: int | None = None


from typing import Any
from app.domain.entities.question import QuestionStatus, DuplicateStatus


class QuestionOptionToStudent(BaseModel):
    id: str
    text: str
    is_correct: bool | None = None
    fixed: bool = False

    model_config = {"from_attributes": True}

    @field_validator("is_correct", mode="before")
    @classmethod
    def hide_correctness(cls, v: Any) -> None:
        return None


class QuestionToStudent(BaseModel):
    id: UUID
    pool_type: PoolType
    difficulty: Difficulty
    content: str
    options: list[QuestionOptionToStudent]
    solution: str | None = None
    lesson_id: UUID | None = None
    tags: list[str] = Field(default_factory=list)
    created_by: int
    created_at: datetime
    status: QuestionStatus = QuestionStatus.PUBLIC
    duplicate_status: DuplicateStatus = DuplicateStatus.NONE
    duplicate_of_question_id: UUID | None = None
    is_difficulty_ai_suggested: bool = False
    is_answer_ai_generated: bool = False
    is_solution_ai_generated: bool = False
    import_session_id: UUID | None = None

    model_config = {"from_attributes": True}

    @field_validator("tags", mode="before")
    @classmethod
    def convert_tags_to_str(cls, v: list | None) -> list[str]:
        if not v:
            return []
        return [str(item) for item in v]

    @field_validator("solution", mode="before")
    @classmethod
    def hide_solution(cls, v: Any) -> None:
        return None
    
class QuestionOut(BaseModel):
    id: UUID
    pool_type: PoolType
    difficulty: Difficulty
    content: str
    options: list[QuestionOptionOut]
    solution: str | None = None
    lesson_id: UUID | None
    tags: list[str]
    created_by: int
    created_at: datetime
    status: QuestionStatus = QuestionStatus.PUBLIC
    duplicate_status: DuplicateStatus = DuplicateStatus.NONE
    duplicate_of_question_id: UUID | None = None
    is_difficulty_ai_suggested: bool = False
    is_answer_ai_generated: bool = False
    is_solution_ai_generated: bool = False
    import_session_id: UUID | None = None

    model_config = {"from_attributes": True}

    @field_validator("tags", mode="before")
    @classmethod
    def convert_tags_to_str(cls, v: list | None) -> list[str]:
        if not v:
            return []
        return [str(item) for item in v]


class QuestionListQuery(BaseModel):
    pool_type: PoolType | None = None
    difficulty: Difficulty | None = None
    lesson_id: UUID | None = None
    tag: str | None = None
    import_session_id: UUID | None = None
    status: QuestionStatus | None = None
    related_questions: bool | None = None
    offset: int = 0
    limit: int = 50


class QuestionBulkItem(BaseModel):
    question: str
    options: list[QuestionOptionIn]
    solution: str | None = None
    difficulty: Difficulty | None = None
    pool_type: PoolType | None = None
    tags: list[str] = Field(default_factory=list)


class QuestionBulkCreate(BaseModel):
    questions: list[QuestionBulkItem]
    pool_type: PoolType = PoolType.PRACTICE
    difficulty: Difficulty = Difficulty.EASY
    lesson_id: UUID | None = None
    tags: list[UUID] = Field(default_factory=list)
    created_by: int | None = None


class QuestionAnswerIn(BaseModel):
    option_id: str


class QuestionAnswerOut(BaseModel):
    is_correct: bool
    correct_option_id: str
    solution: str | None = None


class RelatedQuestionsIn(BaseModel):
    content: str = Field(min_length=3, max_length=20_000)
    limit: int = Field(default=10, ge=1, le=50)
    min_score: float | None = Field(default=None, ge=-1, le=1)
    pool_type: PoolType | None = None

    @field_validator("content")
    @classmethod
    def normalize_content(cls, value: str) -> str:
        value = value.strip()
        if len(value) < 3:
            raise ValueError(
                "content must contain at least 3 non-whitespace characters"
            )
        return value


class RelatedQuestionOptionOut(BaseModel):
    id: str
    text: str
    fixed: bool


class RelatedQuestionOut(BaseModel):
    id: UUID
    content: str
    pool_type: PoolType
    difficulty: Difficulty
    options: list[RelatedQuestionOptionOut]
    lesson_id: UUID | None
    tags: list[str]
    score: float
