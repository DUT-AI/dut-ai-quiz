from abc import ABC, abstractmethod
from uuid import UUID


class IHomeworkEvaluationQueue(ABC):
    @abstractmethod
    async def enqueue_registration(self, homework_id: UUID) -> None:
        raise NotImplementedError

    @abstractmethod
    async def enqueue_evaluation(self, submission_id: UUID) -> None:
        raise NotImplementedError
