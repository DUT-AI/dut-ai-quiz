import dataclasses
from datetime import datetime
from typing import Any
from uuid import UUID

from enum import Enum

from app.domain.value_objects import Difficulty, PoolType

class QuestionStatus(str, Enum):
    DRAFT = "DRAFT"
    PUBLIC = "PUBLIC"

class DuplicateStatus(str, Enum):
    NONE = "NONE"
    POSSIBLE_DUPLICATE = "POSSIBLE_DUPLICATE"
    EXACT_DUPLICATE = "EXACT_DUPLICATE"



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
    status: QuestionStatus = QuestionStatus.PUBLIC
    duplicate_status: DuplicateStatus = DuplicateStatus.NONE
    duplicate_of_question_id: UUID | None = None
    is_difficulty_ai_suggested: bool = False
    is_answer_ai_generated: bool = False
    is_solution_ai_generated: bool = False
    import_session_id: UUID | None = None
