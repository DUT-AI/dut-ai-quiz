from uuid import UUID

from app.application.dtos.homework import HomeworkOutDTO, UpdateHomeworkDTO
from app.domain.interfaces import IManageService, IS3Client
from app.domain.interfaces.homework_queue import IHomeworkEvaluationQueue
from app.domain.interfaces.homework_repo import IHomeworkRepository

from ._shared import (
    build_homework_out,
    ensure_lesson_exists,
    get_homework_or_raise,
    resolve_assignees,
    upload_homework_file,
)


class UpdateHomeworkUseCase:
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

    async def execute(
        self,
        homework_id: UUID,
        payload: UpdateHomeworkDTO,
    ) -> HomeworkOutDTO:
        homework = await get_homework_or_raise(self._repository, homework_id)
        if payload.lesson_id is not None:
            await ensure_lesson_exists(self._repository, payload.lesson_id)
            homework.lesson_id = payload.lesson_id
        if payload.title is not None:
            homework.title = payload.title.strip()
        if payload.description is not None:
            homework.description = payload.description.strip()
        if payload.deadline is not None:
            homework.deadline = payload.deadline
        if payload.file is not None:
            homework.attachment_key = await upload_homework_file(
                self._storage,
                payload.file,
                prefix="homeworks/attachments",
                required_archive=False,
            )

        if payload.assignee_ids is not None or payload.team_ids is not None:
            assigned = await resolve_assignees(
                self._manage_service,
                payload.assignee_ids or [],
                payload.team_ids or [],
            )
            await self._repository.replace_assignments(
                homework_id,
                assigned,
            )
            homework.assignee_ids = sorted(assigned)

        updated = await self._repository.update_homework(homework)
        await self._queue.enqueue_registration(homework_id)
        return await build_homework_out(self._repository, updated)
