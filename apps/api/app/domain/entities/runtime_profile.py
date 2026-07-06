import dataclasses
from datetime import datetime
from uuid import UUID


@dataclasses.dataclass(slots=True)
class RuntimeProfileEntity:
    """
    Represents a pre-built Docker environment for hackathon submission execution.
    Examples: classic-ml-cpu, cv-gpu, nlp-gpu, tensorflow-gpu, audio-gpu
    """
    id: UUID
    name: str  # Unique identifier like 'classic-ml-cpu'
    display_name: str  # Human-readable name
    description: str
    docker_image: str  # Docker image name
    docker_image_tag: str  # Image tag or digest for version control
    python_version: str | None
    cuda_version: str | None  # For GPU profiles
    allowed_packages_json: str | None  # JSON string of allowed packages
    cpu_limit: float  # CPU cores (e.g., 2.0)
    memory_limit_mb: int  # Memory in MB
    gpu_enabled: bool
    gpu_limit: int  # Number of GPUs (0 if gpu_enabled=False)
    timeout_seconds: int  # Execution timeout
    pids_limit: int  # Max number of processes
    is_active: bool
    created_at: datetime
    updated_at: datetime | None = None
    
    def validate_active(self) -> None:
        """Ensures the profile is active before use."""
        if not self.is_active:
            raise ValueError(f"Runtime profile '{self.name}' is not active")
