from app.domain.interfaces.lesson_repo import ILessonRepository
from app.domain.interfaces.module_repo import IModuleRepository


class ListModulesUseCase:
    """List all modules along with their lessons."""

    def __init__(
        self, module_repo: IModuleRepository, lesson_repo: ILessonRepository
    ) -> None:
        self._module_repo = module_repo
        self._lesson_repo = lesson_repo

    async def execute(self) -> list[dict]:
        """Execute the use case to list all modules with their lessons."""
        modules = await self._module_repo.list_all()
        lessons = await self._lesson_repo.list_all()

        # Group lessons by module_id
        module_lessons = {}
        for lesson in lessons:
            if lesson.module_id:
                module_lessons.setdefault(lesson.module_id, []).append(lesson)

        result = []
        for m in modules:
            result.append(
                {
                    "id": m.id,
                    "name": m.name,
                    "description": m.description,
                    "order": m.order,
                    "created_at": m.created_at,
                    "lessons": module_lessons.get(m.id, []),
                }
            )

        return result
