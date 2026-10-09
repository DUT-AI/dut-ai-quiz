from uuid import UUID

from app.application.dtos.homework import HomeworkOutDTO
from app.domain.interfaces.homework_queue import IHomeworkEvaluationQueue
from app.domain.interfaces.homework_repo import IHomeworkRepository

from ._shared import build_homework_out, get_homework_or_raise


class RetryHomeworkRubricUseCase:
    def __init__(
        self,
        repository: IHomeworkRepository,
        queue: IHomeworkEvaluationQueue,
    ) -> None:
        self._repository = repository
        self._queue = queue

    async def execute(self, homework_id: UUID) -> HomeworkOutDTO:
        await get_homework_or_raise(self._repository, homework_id)
        homework = await self._repository.reset_homework_grading(homework_id)
        await self._queue.enqueue_registration(homework_id)
        return await build_homework_out(self._repository, homework)
