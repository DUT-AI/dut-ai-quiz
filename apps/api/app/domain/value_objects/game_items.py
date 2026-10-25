from dataclasses import dataclass, field
from typing import Any
from uuid import UUID

from app.domain.interfaces.question_repo import IQuestionRepository
from app.domain.value_objects.gamification import QuestionMeta


@dataclass(frozen=True)
class ItemExecutionContext:
    question_id: UUID
    current_question_meta: QuestionMeta | None
    question_repo: IQuestionRepository


@dataclass
class ItemExecutionResult:
    item_name: str
    eliminated_option_ids: list[str] = field(default_factory=list)
    time_freeze_active: bool = False
    metadata: dict[str, Any] = field(default_factory=dict)
