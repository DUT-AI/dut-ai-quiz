import dataclasses
from datetime import datetime
from typing import Any
from uuid import UUID
from app.infrastructure.persistence.models import PoolType


@dataclasses.dataclass
class QuestionEntity:
    id: UUID
    pool_type: PoolType
    content: str
    options: list[dict[str, Any]]
    solution: str | None
    lesson_id: UUID | None
    tags: list[str]
    created_by: int
    created_at: datetime
