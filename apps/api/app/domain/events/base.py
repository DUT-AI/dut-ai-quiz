import dataclasses
from datetime import datetime
from app.core.datetime_utils import now_ict

@dataclasses.dataclass(frozen=True, kw_only=True)
class DomainEvent:
    occurred_at: datetime = dataclasses.field(default_factory=now_ict)
