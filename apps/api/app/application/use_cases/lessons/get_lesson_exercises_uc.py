from app.application.dtos.homework import (
    ExerciseItemDTO,
    LessonExercisesMetadataOutDTO,
)
from app.domain.exceptions.exceptions import NotFoundException
from app.domain.interfaces import (
    IHomeworkRepository,
    ILessonRepository,
)


class GetLessonExercisesUseCase:
    """Get all active coding exercises for a lesson.

    Used by DUT-AI Manager to track multi-exercise completion progress.
    """

    def __init__(
        self,
        lesson_repo: ILessonRepository,
        homework_repo: IHomeworkRepository,
    ) -> None:
        self._lesson_repo = lesson_repo
        self._homework_repo = homework_repo

    async def execute(self, lesson_slug: str) -> LessonExercisesMetadataOutDTO:
        lesson = await self._lesson_repo.get_by_identifier(lesson_slug)
        if not lesson or not lesson.id:
            raise NotFoundException(
                f"Bài học '{lesson_slug}' không tồn tại trên hệ thống Quiz."
            )

        homeworks = await self._homework_repo.list_homeworks(lesson_id=lesson.id)
        exercises = [
            ExerciseItemDTO(
                id=hw.id,
                lesson_id=hw.lesson_id,
                title=hw.title,
                description=hw.description,
                created_at=hw.created_at,
                has_attachment=hw.attachment_key is not None,
                attachment_filename=None,
            )
            for hw in homeworks
            if hw.id is not None
        ]

        return LessonExercisesMetadataOutDTO(
            lesson_slug=lesson.slug or str(lesson.id),
            lesson_name=lesson.name,
            total_exercises=len(exercises),
            exercises=exercises,
        )
