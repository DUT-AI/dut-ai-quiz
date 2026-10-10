from typing import Any, Protocol

from app.domain.value_objects.submission import SubmissionStorageInfo


class IHackathonSubmissionStore(Protocol):
    """Interface protocol for storing hackathon submission files."""

    def upload_submission_files(
        self,
        submission_id: str,
        hackathon_slug: str,
        sender_slug: str,
        script_file: Any,
        model_file: Any | None = None,
        model_filename: str | None = None,
    ) -> SubmissionStorageInfo:
        """Upload script and optional model weights files and return storage details."""
        ...
