from app.application.dtos.lesson import LessonMetadataOutDTO
from app.domain.exceptions.exceptions import NotFoundException
from app.domain.interfaces import (
    IHomeworkRepository,
    ILessonRepository,
    IQuestionRepository,
)
from app.domain.value_objects import PoolType


class GetLessonMetadataUseCase:
    """Get lesson metadata and component readiness (coding homework and game questions)

    used for validation by DUT-AI Manager.
    """

    def __init__(
        self,
        lesson_repo: ILessonRepository,
        homework_repo: IHomeworkRepository,
        question_repo: IQuestionRepository,
    ) -> None:
        self._lesson_repo = lesson_repo
        self._homework_repo = homework_repo
        self._question_repo = question_repo

    async def execute(self, lesson_slug: str) -> LessonMetadataOutDTO:
        lesson = await self._lesson_repo.get_by_identifier(lesson_slug)
        if not lesson or not lesson.id:
            raise NotFoundException(
                f"Bài học '{lesson_slug}' không tồn tại trên hệ thống Quiz."
            )

        coding_count = await self._homework_repo.count_active_by_lesson(lesson.id)
        game_count = await self._question_repo.count_by_lesson_and_pool(
            lesson.id, PoolType.GAME
        )

        has_coding = coding_count > 0
        has_game = game_count > 0

        return LessonMetadataOutDTO(
            slug=lesson.slug or str(lesson.id),
            name=lesson.name,
            has_coding=has_coding,
            has_game=has_game,
            coding_count=coding_count,
            game_question_count=game_count,
            is_ready=has_coding or has_game,
        )
