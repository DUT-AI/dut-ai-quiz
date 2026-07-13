from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass
class TagEntity:
    """Domain entity representing a tag."""

    id: UUID
    name: str
    created_at: datetime
