from uuid import UUID

from app.application.dtos.homework import HomeworkOutDTO, UpdateHomeworkDTO
from app.domain.interfaces import IS3Client
from app.domain.interfaces.homework_queue import IHomeworkEvaluationQueue
from app.domain.interfaces.homework_repo import IHomeworkRepository

from ._shared import (
    build_homework_out,
    ensure_lesson_exists,
    get_homework_or_raise,
    upload_homework_file,
)


class UpdateHomeworkUseCase:
    def __init__(
        self,
        repository: IHomeworkRepository,
        storage: IS3Client,
        queue: IHomeworkEvaluationQueue,
    ) -> None:
        self._repository = repository
        self._storage = storage
        self._queue = queue

    async def execute(
        self,
        homework_id: UUID,
        payload: UpdateHomeworkDTO,
    ) -> HomeworkOutDTO:
        homework = await get_homework_or_raise(self._repository, homework_id)
        grading_content_changed = (
            (payload.title is not None and payload.title.strip() != homework.title)
            or (
                payload.description is not None
                and payload.description.strip() != homework.description
            )
            or payload.file is not None
        )
        if payload.lesson_id is not None:
            await ensure_lesson_exists(self._repository, payload.lesson_id)
            homework.lesson_id = payload.lesson_id
        if payload.title is not None:
            homework.title = payload.title.strip()
        if payload.description is not None:
            homework.description = payload.description.strip()
        if payload.file is not None:
            homework.attachment_key = await upload_homework_file(
                self._storage,
                payload.file,
                prefix="homeworks/attachments",
                required_archive=False,
            )

        updated = await self._repository.update_homework(homework)
        if grading_content_changed:
            await self._queue.enqueue_registration(homework_id)
        return await build_homework_out(self._repository, updated)
