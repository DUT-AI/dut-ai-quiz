import abc
from uuid import UUID
from app.domain.entities.import_session import ImportSessionEntity


class IImportSessionRepository(abc.ABC):
    @abc.abstractmethod
    async def create(self, session: ImportSessionEntity) -> ImportSessionEntity:
        """Creates a new import session."""
        pass

    @abc.abstractmethod
    async def get_by_id(self, session_id: UUID) -> ImportSessionEntity | None:
        """Retrieves an import session by ID."""
        pass

    @abc.abstractmethod
    async def update(self, session: ImportSessionEntity) -> ImportSessionEntity:
        """Updates an existing import session."""
        pass
