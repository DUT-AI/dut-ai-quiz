import abc
from uuid import UUID

class IPdfImportQueue(abc.ABC):
    @abc.abstractmethod
    async def enqueue_parse_pdf(
        self,
        job_id: UUID,
        file_path: str,
        user_id: int,
        target_scope: str | None,
        password: str | None,
    ) -> None:
        """Enqueues a PDF parse job."""
        pass
