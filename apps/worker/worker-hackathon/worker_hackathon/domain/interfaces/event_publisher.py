from abc import ABC, abstractmethod

from app.domain.entities.submission import HackathonSubmissionEntity


class ISubmissionEventPublisher(ABC):
    @abstractmethod
    async def publish_submission_update(
        self, submission: HackathonSubmissionEntity, event_type: str
    ) -> None:
        """Publish a submission status update for realtime consumers."""
        pass
