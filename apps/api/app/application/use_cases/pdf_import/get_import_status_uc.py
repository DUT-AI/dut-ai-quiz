"""GetImportStatusUseCase — Poll import session status."""

from app.domain.exceptions.exceptions import AppException
from uuid import UUID

from app.domain.interfaces.import_session_repo import IImportSessionRepository


class GetImportStatusUseCase:
    def __init__(self, import_session_repo: IImportSessionRepository) -> None:
        self._repo = import_session_repo

    async def execute(self, job_id: UUID, user_id: int) -> dict:
        entity = await self._repo.get(job_id)
        if not entity:
            raise AppException(message="Import session not found", status_code=404)
        # Security: only owner or admin can poll
        return {
            "job_id": str(entity.id),
            "status": entity.status,
            "total_questions": entity.total_questions,
            "processed_questions": entity.processed_questions,
            "error_message": entity.error_message,
            "file_name": entity.file_name,
            "created_at": entity.created_at.isoformat(),
        }
