from abc import ABC, abstractmethod
from uuid import UUID

from app.domain.entities.hackathon import HackathonTaskEntity
from app.domain.entities.submission import HackathonSubmissionEntity


class ISubmissionRepository(ABC):
    @abstractmethod
    async def get_submission(
        self, submission_id: UUID
    ) -> HackathonSubmissionEntity | None:
        """Load a submission by id."""
        pass

    @abstractmethod
    async def get_task(self, task_id: UUID) -> HackathonTaskEntity | None:
        """Load the hackathon task related to a submission."""
        pass

    @abstractmethod
    async def update_submission(
        self, submission: HackathonSubmissionEntity
    ) -> HackathonSubmissionEntity:
        """Persist submission status, score, error and logs."""
        pass
