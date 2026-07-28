from abc import ABC, abstractmethod
from uuid import UUID


class ICancellationToken(ABC):
    @abstractmethod
    async def is_cancelled(self, submission_id: UUID) -> bool:
        """Return True when a submission has been cancelled by the API."""
        pass
