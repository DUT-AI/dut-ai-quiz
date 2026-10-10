import dataclasses
from uuid import UUID

from .base import DomainEvent


@dataclasses.dataclass(frozen=True, kw_only=True)
class AttemptViolationEvent(DomainEvent):
    attempt_id: UUID
    user_id: int
    reason: str
