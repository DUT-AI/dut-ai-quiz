from app.application.dtos.homework import CreateHomeworkDTO, HomeworkOutDTO
from app.domain.entities.homework import HomeworkEntity
from app.domain.interfaces import IManageService, IS3Client
from app.domain.interfaces.homework_queue import IHomeworkEvaluationQueue
from app.domain.interfaces.homework_repo import IHomeworkRepository

from ._shared import (
    build_homework_out,
    ensure_lesson_exists,
    resolve_assignees,
    upload_homework_file,
)


class CreateHomeworkUseCase:
    def __init__(
        self,
        repository: IHomeworkRepository,
        manage_service: IManageService,
        storage: IS3Client,
        queue: IHomeworkEvaluationQueue,
    ) -> None:
        self._repository = repository
        self._manage_service = manage_service
        self._storage = storage
        self._queue = queue

    async def execute(self, payload: CreateHomeworkDTO) -> HomeworkOutDTO:
        await ensure_lesson_exists(self._repository, payload.lesson_id)
        assigned = await resolve_assignees(
            self._manage_service,
            payload.assignee_ids,
            payload.team_ids,
        )
        attachment_key = await upload_homework_file(
            self._storage,
            payload.file,
            prefix="homeworks/attachments",
            required_archive=False,
        )
        homework = await self._repository.create_homework(
            HomeworkEntity(
                lesson_id=payload.lesson_id,
                title=payload.title.strip(),
                description=payload.description.strip(),
                deadline=payload.deadline,
                attachment_key=attachment_key,
                created_by=payload.created_by,
            )
        )
        if homework.id is None:
            raise ValueError("Created homework must be persisted")
        await self._repository.replace_assignments(homework.id, assigned)
        homework.assignee_ids = sorted(assigned)
        await self._queue.enqueue_registration(homework.id)
        return await build_homework_out(self._repository, homework)
