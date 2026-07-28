from abc import ABC, abstractmethod
from uuid import UUID

from app.domain.entities.homework import HomeworkEntity, HomeworkSubmissionEntity


class IHomeworkRepository(ABC):
    @abstractmethod
    async def list_homeworks(
        self,
        user_id: int | None = None,
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
    async def replace_assignments(
        self, homework_id: UUID, user_ids: set[int]
    ) -> None:
        raise NotImplementedError

    @abstractmethod
    async def is_assigned(self, homework_id: UUID, user_id: int) -> bool:
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
    async def list_submissions(
        self, homework_id: UUID
    ) -> list[HomeworkSubmissionEntity]:
        raise NotImplementedError

    @abstractmethod
    async def unsubmitted_user_ids(self, homework_id: UUID) -> list[int]:
        raise NotImplementedError
