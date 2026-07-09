from typing import Protocol
from uuid import UUID


class ISubmissionQueue(Protocol):
    """Interface protocol for enqueueing evaluation jobs in the background queue."""

    async def enqueue_evaluation(
        self,
        submission_id: UUID,
    ) -> None:
        """Enqueue a background job to evaluate a hackathon submission."""
        ...
