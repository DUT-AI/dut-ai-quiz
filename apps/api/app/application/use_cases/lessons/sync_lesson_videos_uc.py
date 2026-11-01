from uuid import UUID, uuid4

from app.core.youtube import parse_youtube_url
from app.domain.entities.lesson_video import LessonVideoEntity
from app.domain.exceptions.exceptions import NotFoundException
from app.domain.interfaces import ILessonRepository, ILessonVideoRepository
from app.presentation.schemas.lessons import LessonVideoCreate


class SyncLessonVideosUseCase:
    """Synchronize and batch update the reference videos playlist for a lesson."""

    def __init__(
        self,
        lesson_repo: ILessonRepository,
        video_repo: ILessonVideoRepository,
    ) -> None:
        self._lesson_repo = lesson_repo
        self._video_repo = video_repo

    async def execute(
        self, lesson_id: UUID, items: list[LessonVideoCreate]
    ) -> list[LessonVideoEntity]:
        lesson = await self._lesson_repo.get(lesson_id)
        if not lesson:
            raise NotFoundException("Lesson not found!")

        new_entities: list[LessonVideoEntity] = []
        for index, item in enumerate(items):
            parsed = parse_youtube_url(item.url)
            order = item.order if item.order is not None and item.order >= 0 else index
            entity = LessonVideoEntity(
                id=uuid4(),
                lesson_id=lesson_id,
                title=item.title.strip(),
                url=item.url.strip(),
                youtube_video_id=parsed["video_id"],
                start_seconds=parsed["start_seconds"],
                order=order,
                description=item.description.strip() if item.description else "",
            )
            new_entities.append(entity)

        return await self._video_repo.replace_lesson_videos(lesson_id, new_entities)
