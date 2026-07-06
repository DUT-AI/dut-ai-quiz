"""
Pydantic schemas for Runtime Profile API
"""
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field


class RuntimeProfileCreate(BaseModel):
    """Schema for creating a runtime profile (Admin only)."""
    name: str = Field(..., min_length=1, max_length=100, description="Unique profile name (e.g., 'classic-ml-cpu')")
    display_name: str = Field(..., min_length=1, max_length=200, description="Human-readable name")
    description: str = Field(default="", description="Profile description")
    docker_image: str = Field(..., min_length=1, max_length=500, description="Docker image name")
    docker_image_tag: str = Field(..., min_length=1, max_length=100, description="Image tag or digest")
    python_version: str | None = Field(None, max_length=50, description="Python version (e.g., '3.10')")
    cuda_version: str | None = Field(None, max_length=50, description="CUDA version if GPU enabled")
    allowed_packages_json: str | None = Field(None, description="JSON string of allowed packages")
    cpu_limit: float = Field(default=2.0, ge=0.1, le=32.0, description="CPU cores limit")
    memory_limit_mb: int = Field(default=2048, ge=128, le=32768, description="Memory limit in MB")
    gpu_enabled: bool = Field(default=False, description="Whether GPU is enabled")
    gpu_limit: int = Field(default=0, ge=0, le=8, description="Number of GPUs")
    timeout_seconds: int = Field(default=300, ge=10, le=3600, description="Execution timeout in seconds")
    pids_limit: int = Field(default=100, ge=10, le=1000, description="Max number of processes")
    is_active: bool = Field(default=True, description="Whether profile is active")


class RuntimeProfileUpdate(BaseModel):
    """Schema for updating a runtime profile (Admin only)."""
    name: str | None = Field(None, min_length=1, max_length=100)
    display_name: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = None
    docker_image: str | None = Field(None, min_length=1, max_length=500)
    docker_image_tag: str | None = Field(None, min_length=1, max_length=100)
    python_version: str | None = None
    cuda_version: str | None = None
    allowed_packages_json: str | None = None
    cpu_limit: float | None = Field(None, ge=0.1, le=32.0)
    memory_limit_mb: int | None = Field(None, ge=128, le=32768)
    gpu_enabled: bool | None = None
    gpu_limit: int | None = Field(None, ge=0, le=8)
    timeout_seconds: int | None = Field(None, ge=10, le=3600)
    pids_limit: int | None = Field(None, ge=10, le=1000)
    is_active: bool | None = None


class RuntimeProfileResponse(BaseModel):
    """Schema for runtime profile response."""
    id: UUID
    name: str
    display_name: str
    description: str
    docker_image: str
    docker_image_tag: str
    python_version: str | None
    cuda_version: str | None
    allowed_packages_json: str | None
    cpu_limit: float
    memory_limit_mb: int
    gpu_enabled: bool
    gpu_limit: int
    timeout_seconds: int
    pids_limit: int
    is_active: bool
    created_at: datetime
    updated_at: datetime | None

    class Config:
        from_attributes = True


class RuntimeProfileListResponse(BaseModel):
    """Schema for listing runtime profiles."""
    profiles: list[RuntimeProfileResponse]
    total: int


class ToggleRuntimeProfileRequest(BaseModel):
    """Schema for enabling/disabling a profile."""
    is_active: bool
