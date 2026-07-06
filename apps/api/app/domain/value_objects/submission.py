from dataclasses import dataclass


@dataclass(frozen=True)
class SubmissionStorageInfo:
    """Value object containing storage paths and access URLs for a task submission."""

    script_s3_key: str
    model_s3_key: str | None
    script_url: str
    model_url: str | None
