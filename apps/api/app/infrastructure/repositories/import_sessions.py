from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.domain.entities.import_session import ImportSessionEntity
from app.domain.interfaces.import_session_repo import IImportSessionRepository
from app.infrastructure.persistence.models.import_session import ImportSessionModel


class ImportSessionRepository(IImportSessionRepository):
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, entity: ImportSessionEntity) -> ImportSessionEntity:
        model = ImportSessionModel.from_entity(entity)
        self.session.add(model)
        await self.session.flush()
        await self.session.refresh(model)
        return model.to_entity()

    async def get_by_id(self, session_id: UUID) -> ImportSessionEntity | None:
        model = await self.session.get(ImportSessionModel, session_id)
        if not model:
            return None
        return model.to_entity()

    async def update(self, entity: ImportSessionEntity) -> ImportSessionEntity:
        model = await self.session.get(ImportSessionModel, entity.id)
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
