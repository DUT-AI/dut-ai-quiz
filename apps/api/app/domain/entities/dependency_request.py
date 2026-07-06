import dataclasses
from datetime import datetime
from uuid import UUID

from app.domain.value_objects.enums import DependencyRequestStatus


@dataclasses.dataclass(slots=True)
class DependencyRequestEntity:
    """
    Represents a request from a participant to add a package to a runtime profile.
    Admin must approve/reject before the package is available.
    """
    id: UUID
    hackathon_id: UUID
    task_id: UUID | None  # Optional: specific task
    user_id: int
    team_id: UUID | None  # Optional: if team submission
    package_name: str
    package_version: str | None  # Can request specific version
    reason: str  # Why this package is needed
    status: DependencyRequestStatus
    admin_note: str | None  # Admin's comment when reviewing
    created_at: datetime
    reviewed_at: datetime | None = None
    reviewed_by: int | None = None  # Admin user ID
    
    def is_pending(self) -> bool:
        return self.status == DependencyRequestStatus.PENDING
    
    def approve(self, admin_id: int, note: str | None = None) -> None:
        """Mark request as approved by admin."""
        if not self.is_pending():
            raise ValueError("Can only approve pending requests")
        self.status = DependencyRequestStatus.APPROVED
        self.reviewed_by = admin_id
        self.reviewed_at = datetime.utcnow()
        self.admin_note = note
    
    def reject(self, admin_id: int, note: str) -> None:
        """Mark request as rejected by admin."""
        if not self.is_pending():
            raise ValueError("Can only reject pending requests")
        self.status = DependencyRequestStatus.REJECTED
        self.reviewed_by = admin_id
        self.reviewed_at = datetime.utcnow()
        self.admin_note = note
