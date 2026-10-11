from dataclasses import dataclass
from datetime import datetime, timedelta


@dataclass(frozen=True, slots=True)
class GradingAttempt:
    """Identify one persisted claim, including claims after a manual reset."""

    number: int
    started_at: datetime


@dataclass(frozen=True, slots=True)
class GradingRetryPolicy:
    max_attempts: int
    lease_duration: timedelta
    retry_delay_seconds: int = 10

    def __post_init__(self) -> None:
        if self.max_attempts < 1 or self.lease_duration <= timedelta(0):
            raise ValueError("Retry attempts and lease duration must be positive")
        if self.retry_delay_seconds < 0:
            raise ValueError("Retry delay must not be negative")

    def can_retry(self, attempt: GradingAttempt, *, retryable: bool) -> bool:
        return retryable and attempt.number < self.max_attempts

    def delay_seconds(self, attempt: GradingAttempt) -> int:
        return self.retry_delay_seconds * attempt.number
