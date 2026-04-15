import dataclasses
from datetime import datetime
from typing import Any
from uuid import UUID
from app.infrastructure.persistence.models import Difficulty, PoolType

@dataclasses.dataclass
class QuestionEntity:
    id: UUID
    pool_type: PoolType
    content: str
    options: list[dict[str, Any]]
    solution: str | None
    difficulty: Difficulty
    tags: list[str]
    created_at: datetime
