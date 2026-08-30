from abc import ABC, abstractmethod
from typing import Any
from uuid import UUID

from app.domain.entities.homework import HomeworkEntity, HomeworkSubmissionEntity


class IHomeworkRepository(ABC):
    @abstractmethod
    async def list_homeworks(
        self,
        lesson_id: UUID | None = None,
    ) -> list[HomeworkEntity]:
        raise NotImplementedError

    @abstractmethod
    async def lesson_exists(self, lesson_id: UUID) -> bool:
        raise NotImplementedError

    @abstractmethod
    async def get_homework(self, homework_id: UUID) -> HomeworkEntity | None:
        raise NotImplementedError

    @abstractmethod
    async def create_homework(self, homework: HomeworkEntity) -> HomeworkEntity:
        raise NotImplementedError

    @abstractmethod
    async def update_homework(self, homework: HomeworkEntity) -> HomeworkEntity:
        raise NotImplementedError

    @abstractmethod
    async def archive_homework(self, homework_id: UUID) -> bool:
        raise NotImplementedError

    @abstractmethod
    async def create_submission(
        self, submission: HomeworkSubmissionEntity
    ) -> HomeworkSubmissionEntity:
        raise NotImplementedError

    @abstractmethod
    async def get_submission(
        self, submission_id: UUID
    ) -> HomeworkSubmissionEntity | None:
        raise NotImplementedError

    @abstractmethod
    async def get_latest_submission(
        self, homework_id: UUID, user_id: int
    ) -> HomeworkSubmissionEntity | None:
        raise NotImplementedError

    @abstractmethod
    async def retry_failed_submission(
        self, submission_id: UUID
    ) -> HomeworkSubmissionEntity | None:
        """Atomically move a failed submission back to grading."""
        raise NotImplementedError

    @abstractmethod
    async def list_submissions(
        self, homework_id: UUID
    ) -> list[HomeworkSubmissionEntity]:
        raise NotImplementedError

    @abstractmethod
    async def list_completed_user_ids(self, homework_id: UUID) -> list[int]:
        """List users whose latest submission has finished grading."""
        raise NotImplementedError

    @abstractmethod
    async def list_completed_members_by_lesson(
        self, lesson_id: UUID
    ) -> list[Any]:
        """List member completion stats for homeworks in the given lesson."""
        raise NotImplementedError

    @abstractmethod
    async def count_submitters(self, homework_id: UUID) -> int:
        raise NotImplementedError
