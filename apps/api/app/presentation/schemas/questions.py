from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.infrastructure.persistence.models import Difficulty, PoolType


class QuestionOptionIn(BaseModel):
    id: str | None = None
    text: str
    is_correct: bool
    fixed: bool = False


class QuestionOptionOut(BaseModel):
    id: str
    text: str
    is_correct: bool
    fixed: bool

    model_config = {"from_attributes": True}


class QuestionCreate(BaseModel):
    pool_type: PoolType
    difficulty: Difficulty = Difficulty.EASY
    content: str = ""
    options: list[QuestionOptionIn] = Field(default_factory=list)
    solution: str | None = None
    lesson_id: UUID | None = None
    tags: list[str] = Field(default_factory=list)
    created_by: int | None = None


class QuestionUpdate(BaseModel):
    pool_type: PoolType | None = None
    difficulty: Difficulty | None = None
    content: str | None = None
    options: list[QuestionOptionIn] | None = None
    solution: str | None = None
    lesson_id: UUID | None = None
    tags: list[str] | None = None
    created_by: int | None = None


class QuestionOut(BaseModel):
    id: UUID
    pool_type: PoolType
    difficulty: Difficulty
    content: str
    options: list[QuestionOptionOut]
    solution: str | None
    lesson_id: UUID | None
    tags: list[str]
    created_by: int
    created_at: datetime

    model_config = {"from_attributes": True}


class QuestionListQuery(BaseModel):
    pool_type: PoolType | None = None
    difficulty: Difficulty | None = None
    lesson_id: UUID | None = None
    tag: str | None = None
    offset: int = 0
    limit: int = 50


class QuestionBulkItem(BaseModel):
    question: str
    options: list[QuestionOptionIn]
    solution: str | None = None
    difficulty: Difficulty | None = None


class QuestionBulkCreate(BaseModel):
    questions: list[QuestionBulkItem]
    pool_type: PoolType = PoolType.PRACTICE
    difficulty: Difficulty = Difficulty.EASY
    lesson_id: UUID | None = None
    tags: list[str] = Field(default_factory=list)
    created_by: int | None = None