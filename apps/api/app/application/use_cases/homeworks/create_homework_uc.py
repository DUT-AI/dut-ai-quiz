from app.application.dtos.homework import CreateHomeworkDTO, HomeworkOutDTO
from app.domain.entities.homework import HomeworkEntity
from app.domain.interfaces import IS3Client
from app.domain.interfaces.homework_queue import IHomeworkEvaluationQueue
from app.domain.interfaces.homework_repo import IHomeworkRepository

from ._shared import (
    HOMEWORK_ATTACHMENT_SUFFIXES,
    build_homework_out,
    ensure_lesson_exists,
    upload_homework_file,
)


class CreateHomeworkUseCase:
    def __init__(
        self,
        repository: IHomeworkRepository,
        storage: IS3Client,
        queue: IHomeworkEvaluationQueue,
    ) -> None:
        self._repository = repository
        self._storage = storage
        self._queue = queue

    async def execute(self, payload: CreateHomeworkDTO) -> HomeworkOutDTO:
        await ensure_lesson_exists(self._repository, payload.lesson_id)
        attachment_key = await upload_homework_file(
            self._storage,
            payload.file,
            prefix="homeworks/attachments",
            allowed_suffixes=HOMEWORK_ATTACHMENT_SUFFIXES,
        )
        homework = await self._repository.create_homework(
            HomeworkEntity(
                lesson_id=payload.lesson_id,
                title=payload.title.strip(),
                description=payload.description.strip(),
                attachment_key=attachment_key,
                created_by=payload.created_by,
            )
        )
        if homework.id is None:
            raise ValueError("Created homework must be persisted")
        await self._queue.enqueue_registration(homework.id)
        return await build_homework_out(self._repository, homework)
