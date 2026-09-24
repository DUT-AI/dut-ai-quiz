from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class TagCreate(BaseModel):
    """Schema for creating a tag."""

    name: str


class TagOut(BaseModel):
    """Schema for returning a tag."""

    id: UUID
    name: str
    created_at: datetime

    model_config = {"from_attributes": True}
