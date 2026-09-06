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

T = TypeVar("T", bound=BaseModel)


class ILLMClient(Protocol):
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

    async def set_homework_processing(self, homework_id: UUID) -> None: ...

    async def save_homework_rubric(
        self,
        homework_id: UUID,
        rubric: dict[str, Any],
    ) -> None: ...

    async def save_homework_error(
        self,
        homework_id: UUID,
        error: str,
    ) -> None: ...

    async def get_submission(
        self,
        submission_id: UUID,
    ) -> SubmissionGradingRecord | None: ...

    async def set_submission_grading(self, submission_id: UUID) -> None: ...

    async def save_submission_result(
        self,
        submission_id: UUID,
        result: GradeResult,
        plagiarism: list[dict[str, Any]],
        copied_user_id: int | None,
    ) -> None: ...

    async def save_submission_error(
        self,
        submission_id: UUID,
        error: str,
        *,
        final: bool,
    ) -> None: ...

    async def list_previous_fingerprints(
        self,
        homework_id: UUID,
        user_id: int,
        file_names: list[str],
    ) -> list[StoredFingerprint]: ...

    async def replace_fingerprints(
        self,
        submission: SubmissionGradingRecord,
        values: list[dict[str, Any]],
    ) -> None: ...

