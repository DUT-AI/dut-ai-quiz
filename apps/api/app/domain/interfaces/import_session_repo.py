from typing import Protocol
from uuid import UUID

from app.domain.entities.import_session import ImportSessionEntity


class IImportSessionRepository(Protocol):
    """Interface protocol for ImportSession persistence operations."""

    async def create(self, entity: ImportSessionEntity) -> ImportSessionEntity:
        """Create a new import session record."""
        ...

    async def get(self, session_id: UUID) -> ImportSessionEntity | None:
        """Get an import session by its UUID."""
        ...

    async def update_status(
        self,
        session_id: UUID,
        status: str,
        error_message: str | None = None,
    ) -> None:
        """Update session status (PROCESSING → COMPLETED | FAILED)."""
        ...

    async def update_progress(
        self,
        session_id: UUID,
        total_questions: int,
        processed_questions: int,
    ) -> None:
        """Update question processing counters."""
        ...
