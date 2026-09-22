from app.application.dtos.homework import CompletedHomeworkMemberOutDTO
from app.domain.exceptions.exceptions import AppException
from app.domain.interfaces.homework_repo import IHomeworkRepository
from app.domain.interfaces.lesson_repo import ILessonRepository


class ListCompletedHomeworkMembersUseCase:
    def __init__(
        self,
        homework_repo: IHomeworkRepository,
        lesson_repo: ILessonRepository,
    ) -> None:
        self._homework_repo = homework_repo
        self._lesson_repo = lesson_repo

    async def execute(
        self,
        lesson_slug: str,
    ) -> list[CompletedHomeworkMemberOutDTO]:
        lesson = await self._lesson_repo.get_by_slug(lesson_slug)

        if lesson is None:
            raise AppException("Bài học không tồn tại", 404)

        return await self._homework_repo.list_completed_members_by_lesson(lesson.id)
