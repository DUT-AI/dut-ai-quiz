from uuid import UUID
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.import_session import ImportSessionEntity
from app.domain.interfaces.import_session_repo import IImportSessionRepository
from app.infrastructure.persistence.models.import_session import ImportSession


class ImportSessionRepository(IImportSessionRepository):
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, entity: ImportSessionEntity) -> ImportSessionEntity:
        model = ImportSession.from_entity(entity)
        self.session.add(model)
        await self.session.flush()
        await self.session.refresh(model)
        return model.to_entity()

    async def get_by_id(self, session_id: UUID) -> ImportSessionEntity | None:
        model = await self.session.get(ImportSession, session_id)
        if not model:
            return None
        return model.to_entity()
        
    async def get(self, session_id: UUID) -> ImportSessionEntity | None:
        return await self.get_by_id(session_id)

    async def update(self, entity: ImportSessionEntity) -> ImportSessionEntity:
        model = await self.session.get(ImportSession, entity.id)
        if not model:
            raise ValueError(f"Import session {entity.id} not found.")

        model.status = entity.status
        model.error_message = entity.error_message
        
        # update fields...
        model.target_scope = entity.target_scope
        model.file_name = entity.file_name
        model.total_questions = entity.total_questions
        model.processed_questions = entity.processed_questions
        model.lesson_id = entity.lesson_id
        if entity.updated_at:
            model.updated_at = entity.updated_at
        
        self.session.add(model)
        await self.session.flush()
        await self.session.refresh(model)
        return model.to_entity()

    async def update_status(
        self,
        session_id: UUID,
        status: str,
        error_message: str | None = None,
    ) -> None:
        values: dict = {"status": status}
        if error_message is not None:
            values["error_message"] = error_message
        await self.session.execute(
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
        await self.session.execute(
            update(ImportSession)
            .where(ImportSession.id == session_id)
            .values(
                total_questions=total_questions,
                processed_questions=processed_questions,
            )
        )
