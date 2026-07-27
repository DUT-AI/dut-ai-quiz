from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.import_session import ImportSessionEntity
from app.domain.interfaces.import_session_repo import IImportSessionRepository
from app.infrastructure.persistence.models.import_session import ImportSession


class ImportSessionRepository(IImportSessionRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._s = session

    async def create(self, entity: ImportSessionEntity) -> ImportSessionEntity:
        model = ImportSession.from_entity(entity)
        self._s.add(model)
        await self._s.flush()
        await self._s.refresh(model)
        return model.to_entity()

    async def get(self, session_id: UUID) -> ImportSessionEntity | None:
        r = await self._s.execute(
            select(ImportSession).where(ImportSession.id == session_id)
        )
        model = r.scalar_one_or_none()
        return model.to_entity() if model else None

    async def update_status(
        self,
        session_id: UUID,
        status: str,
        error_message: str | None = None,
    ) -> None:
        values: dict = {"status": status}
        if error_message is not None:
            values["error_message"] = error_message
        await self._s.execute(
            update(ImportSession)
            .where(ImportSession.id == session_id)
            .values(**values)
        )

    async def update_progress(
        self,
        session_id: UUID,
        total_questions: int,
        processed_questions: int,
    ) -> None:
        await self._s.execute(
            update(ImportSession)
            .where(ImportSession.id == session_id)
            .values(
                total_questions=total_questions,
                processed_questions=processed_questions,
            )
        )
