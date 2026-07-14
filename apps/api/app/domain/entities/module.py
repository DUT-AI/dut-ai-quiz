from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass
class ModuleEntity:
    """Domain entity representing a learning module."""

    id: UUID
    name: str
    description: str
    order: int
    created_at: datetime
