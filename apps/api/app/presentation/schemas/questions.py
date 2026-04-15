from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.infrastructure.persistence.models import Difficulty, PoolType


class QuestionCreate(BaseModel):
    pool_type: PoolType
    content: str = ""
    options: list[dict] = Field(default_factory=list)
    solution: str | None = None
    difficulty: Difficulty = Difficulty.MEDIUM
    tags: list[str] = Field(default_factory=list)


class QuestionUpdate(BaseModel):
    pool_type: PoolType | None = None
    content: str | None = None
    options: list[dict] | None = None
    solution: str | None = None
    difficulty: Difficulty | None = None
    tags: list[str] | None = None


class QuestionOut(BaseModel):
    id: UUID
    pool_type: PoolType
    content: str
    options: list[dict]
    solution: str | None
    difficulty: Difficulty
    tags: list[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class QuestionListQuery(BaseModel):
    pool_type: PoolType | None = None
    difficulty: Difficulty | None = None
    tag: str | None = None
    offset: int = 0
    limit: int = 50
