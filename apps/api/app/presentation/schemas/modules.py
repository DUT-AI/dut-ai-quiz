from datetime import datetime
from uuid import UUID

from app.presentation.schemas.lessons import LessonOut
from pydantic import BaseModel


class ModuleCreate(BaseModel):
    """Schema for creating a module."""

    name: str
    description: str = ""
    order: int = 0


class ModuleUpdate(BaseModel):
    """Schema for updating a module."""

    name: str | None = None
    description: str | None = None
    order: int | None = None


class ModuleOut(BaseModel):
    """Schema for module output data."""

    id: UUID
    name: str
    description: str
    order: int
    created_at: datetime

    model_config = {"from_attributes": True}


class ModuleDetailOut(ModuleOut):
    """Schema for detailed module output including its lessons."""

    lessons: list[LessonOut] = []


class ModuleReorder(BaseModel):
    """Schema for reordering modules."""

    module_ids: list[UUID]

