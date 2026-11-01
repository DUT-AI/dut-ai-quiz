from app.domain.interfaces.lesson_repo import ILessonRepository
from app.domain.interfaces.module_repo import IModuleRepository


class ListModulesUseCase:
    """List modules along with optional lessons and query filters."""

    def __init__(
        self, module_repo: IModuleRepository, lesson_repo: ILessonRepository
    ) -> None:
        self._module_repo = module_repo
        self._lesson_repo = lesson_repo

    async def execute(
        self,
        *,
        q: str | None = None,
        name: str | None = None,
        description: str | None = None,
        order: int | None = None,
        include_lessons: bool = True,
    ) -> list[dict]:
        """Execute the use case to list modules with filters."""
        modules = await self._module_repo.list_all(
            q=q,
            name=name,
            description=description,
            order=order,
        )

        if include_lessons:
            lessons = await self._lesson_repo.list_all()
            # Group lessons by module_id
            module_lessons = {}
            for lesson in lessons:
                if lesson.module_id:
                    module_lessons.setdefault(lesson.module_id, []).append(lesson)
        else:
            module_lessons = {}

        result = []
        for m in modules:
            result.append(
                {
                    "id": m.id,
                    "name": m.name,
                    "description": m.description,
                    "order": m.order,
                    "created_at": m.created_at,
                    "lessons": module_lessons.get(m.id, []) if include_lessons else [],
                }
            )

        return result
