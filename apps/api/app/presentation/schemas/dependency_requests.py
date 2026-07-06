"""
Pydantic schemas for Dependency Request API
"""
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field

from app.domain.value_objects.enums import DependencyRequestStatus


class DependencyRequestCreate(BaseModel):
    """Schema for user creating a dependency request."""
    hackathon_id: UUID = Field(..., description="Hackathon ID")
    task_id: UUID | None = Field(None, description="Optional: specific task ID")
    package_name: str = Field(..., min_length=1, max_length=200, description="Package name (e.g., 'scikit-learn')")
    package_version: str | None = Field(None, max_length=50, description="Optional: specific version (e.g., '1.0.0')")
    reason: str = Field(..., min_length=10, description="Why this package is needed")
    team_id: UUID | None = Field(None, description="Optional: team ID if team submission")


class DependencyRequestResponse(BaseModel):
    """Schema for dependency request response."""
    id: UUID
    hackathon_id: UUID
    task_id: UUID | None
    user_id: int
    team_id: UUID | None
    package_name: str
    package_version: str | None
    reason: str
    status: DependencyRequestStatus
    admin_note: str | None
    created_at: datetime
    reviewed_at: datetime | None
    reviewed_by: int | None

    class Config:
        from_attributes = True


class DependencyRequestListResponse(BaseModel):
    """Schema for listing dependency requests."""
    requests: list[DependencyRequestResponse]
    total: int


class ApproveDependencyRequestRequest(BaseModel):
    """Schema for admin approving a request."""
    admin_note: str | None = Field(None, description="Optional note from admin")


class RejectDependencyRequestRequest(BaseModel):
    """Schema for admin rejecting a request."""
    admin_note: str = Field(..., min_length=1, description="Required: reason for rejection")
