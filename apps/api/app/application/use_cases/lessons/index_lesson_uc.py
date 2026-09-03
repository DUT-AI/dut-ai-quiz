from uuid import UUID

from app.application.services.lesson_index_scheduler import LessonIndexScheduler
from app.domain.interfaces import ILessonRepository


class IndexLessonUseCase:
    def __init__(
        self,
        lesson_repo: ILessonRepository,
        scheduler: LessonIndexScheduler,
    ) -> None:
        self._lesson_repo = lesson_repo
        self._scheduler = scheduler

    async def execute(self, lesson_id: UUID) -> dict | None:
        lesson = await self._lesson_repo.get(lesson_id)
        if lesson is None:
            return None
        queued = await self._scheduler.schedule(lesson)
        return {
            "lesson_id": lesson.id,
            "status": "queued" if queued else "disabled",
        }
