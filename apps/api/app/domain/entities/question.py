import dataclasses
from datetime import datetime
from typing import Any
from uuid import UUID

from app.domain.value_objects import Difficulty, PoolType


@dataclasses.dataclass
class QuestionOptionEntity:
    id: str
    text: str
    is_correct: bool | None
    fixed: bool = False

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "text": self.text,
            "is_correct": self.is_correct,
            "fixed": self.fixed,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "QuestionOptionEntity":
        return cls(
            id=data["id"],
            text=data["text"],
            is_correct=data["is_correct"],
            fixed=data.get("fixed", False),
        )


@dataclasses.dataclass
class QuestionEntity:
    id: UUID
    pool_type: PoolType
    difficulty: Difficulty
    content: str
    options: list[QuestionOptionEntity]
    solution: str | None
    lesson_id: UUID | None
    tags: list[str]
    created_by: int
    created_at: datetime
    embedding: list[float] | None = None
    embedding_model: str | None = None
    embedding_source_hash: str | None = None
