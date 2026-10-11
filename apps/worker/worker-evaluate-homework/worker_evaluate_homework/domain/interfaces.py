from typing import Any, Protocol, TypeVar
from uuid import UUID

from pydantic import BaseModel

from .models import (
    GradeResult,
    HomeworkGradingRecord,
    HomeworkRubric,
    SourceFile,
    StoredFingerprint,
    SubmissionGradingRecord,
)
from .retry import GradingAttempt

T = TypeVar("T", bound=BaseModel)


class ILLMClient(Protocol):
    @property
    def input_token_budget(self) -> int: ...

    async def count_tokens(self, prompt: str, system_instruction: str = "") -> int: ...

    async def generate_structured(
        self,
        prompt: str,
        schema: type[T],
        system_instruction: str = "",
    ) -> T: ...


class IHomeworkArtifactReader(Protocol):
    async def read_homework_text(self, object_key: str | None) -> str: ...

    async def read_submission_sources(
        self,
        object_key: str,
    ) -> list[SourceFile]: ...


class IHomeworkGradingEngine(Protocol):
    async def create_rubric(
        self,
        homework: HomeworkGradingRecord,
        attachment_text: str,
    ) -> HomeworkRubric: ...

    async def grade(
        self,
        rubric: HomeworkRubric,
        sources: list[SourceFile],
    ) -> GradeResult: ...


class IHomeworkGradingRepository(Protocol):
    async def get_homework(
        self,
        homework_id: UUID,
    ) -> HomeworkGradingRecord | None: ...

    async def claim_homework(self, homework_id: UUID) -> GradingAttempt | None: ...

    async def save_homework_rubric(
        self,
        homework_id: UUID,
        rubric: dict[str, Any],
        *,
        attempt: GradingAttempt,
    ) -> bool: ...

    async def save_homework_error(
        self,
        homework_id: UUID,
        error: str,
        *,
        attempt: GradingAttempt,
        retryable: bool = False,
    ) -> bool: ...

    async def get_submission(
        self,
        submission_id: UUID,
    ) -> SubmissionGradingRecord | None: ...

    async def claim_submission(self, submission_id: UUID) -> GradingAttempt | None: ...

    async def save_submission_result(
        self,
        submission_id: UUID,
        result: GradeResult,
        plagiarism: list[dict[str, Any]],
        copied_user_id: int | None,
        *,
        attempt: GradingAttempt,
        fingerprints: list[dict[str, Any]],
    ) -> bool: ...

    async def save_submission_error(
        self,
        submission_id: UUID,
        error: str,
        *,
        attempt: GradingAttempt,
        final: bool,
        retryable: bool = False,
    ) -> bool: ...

    async def list_previous_fingerprints(
        self,
        homework_id: UUID,
        user_id: int,
        file_names: list[str],
    ) -> list[StoredFingerprint]: ...

    async def list_stale_homework_ids(
        self,
        stale_minutes: int = 10,
        days_limit: int = 7,
        limit: int = 10,
    ) -> list[UUID]: ...

    async def list_stale_submission_ids(
        self,
        stale_minutes: int = 15,
        days_limit: int = 7,
        limit: int = 20,
    ) -> list[UUID]: ...


class IHomeworkGradingQueue(Protocol):
    """Return False when an equivalent job is already queued."""

    async def enqueue_registration(self, homework_id: UUID) -> bool: ...

    async def enqueue_evaluation(self, submission_id: UUID) -> bool: ...
