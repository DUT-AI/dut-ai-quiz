from typing import Protocol
from uuid import UUID


class ISubmissionQueue(Protocol):
    """Interface protocol for enqueueing evaluation jobs in the background queue."""

    async def enqueue_evaluation(
        self,
        submission_id: UUID,
        script_s3_key: str,
        ground_truth_s3_key: str,
        metric_type: str,
    ) -> None:
        """Enqueue a background job to evaluate a hackathon submission."""
        ...
