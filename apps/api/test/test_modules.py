from datetime import datetime
from uuid import UUID, uuid4

import pytest

from app.application.use_cases.modules import (
    CreateModuleUseCase,
    DeleteModuleUseCase,
    ListModulesUseCase,
    UpdateModuleUseCase,
    ReorderModulesUseCase,
)
from app.core.datetime_utils import now_ict
from app.domain.entities.lesson import LessonEntity
from app.domain.entities.module import ModuleEntity
from app.domain.exceptions.exceptions import BadRequestException
from app.domain.interfaces import ILessonRepository
from app.domain.interfaces.module_repo import IModuleRepository
from app.presentation.schemas.modules import ModuleCreate, ModuleUpdate, ModuleReorder


class MockModuleRepository(IModuleRepository):
    def __init__(self):
        self.db = {}

    async def list_all(
        self,
        *,
        q: str | None = None,
        name: str | None = None,
        description: str | None = None,
        order: int | None = None,
    ) -> list[ModuleEntity]:
        res = list(self.db.values())
        if q is not None and q.strip():
            res = [m for m in res if m.name.lower().startswith(q.strip().lower())]
        if name is not None and name.strip():
            res = [m for m in res if m.name.lower() == name.strip().lower()]
        if description is not None and description.strip():
            res = [m for m in res if description.strip().lower() in m.description.lower()]
        if order is not None:
            res = [m for m in res if m.order == order]
        return sorted(res, key=lambda x: (x.order, x.created_at))

    async def get(self, module_id: UUID) -> ModuleEntity | None:
        return self.db.get(module_id)

    async def get_by_name(self, name: str) -> ModuleEntity | None:
        for m in self.db.values():
            if m.name.lower() == name.lower():
                return m
        return None

    async def add(self, entity: ModuleEntity) -> ModuleEntity:
        self.db[entity.id] = entity
        return entity

    async def update(self, entity: ModuleEntity) -> ModuleEntity:
        self.db[entity.id] = entity
        return entity

    async def delete(self, entity: ModuleEntity) -> None:
        if entity.id in self.db:
            del self.db[entity.id]


class MockLessonRepository(ILessonRepository):
    def __init__(self, lessons=None):
        self.lessons = lessons or []

    async def list_all(self) -> list[LessonEntity]:
        return self.lessons

    async def get(self, lesson_id: UUID) -> LessonEntity | None:
        for l in self.lessons:
            if l.id == lesson_id:
                return l
        return None

    async def get_by_slug(self, slug: str) -> LessonEntity | None:
        return None

    async def add(self, entity: LessonEntity) -> LessonEntity:
        self.lessons.append(entity)
        return entity

    async def update(self, entity: LessonEntity) -> LessonEntity:
        for i, l in enumerate(self.lessons):
            if l.id == entity.id:
                self.lessons[i] = entity
                return entity
        return entity

    async def delete(self, entity: LessonEntity) -> None:
        self.lessons = [l for l in self.lessons if l.id != entity.id]


@pytest.mark.asyncio
async def test_modules_flow():
    module_repo = MockModuleRepository()
    lesson_repo = MockLessonRepository()

    create_uc = CreateModuleUseCase(module_repo)
    update_uc = UpdateModuleUseCase(module_repo)
    list_uc = ListModulesUseCase(module_repo, lesson_repo)
    reorder_uc = ReorderModulesUseCase(module_repo)
    delete_uc = DeleteModuleUseCase(module_repo)

    # 1. Create Module
    payload = ModuleCreate(name="Introduction to AI", description="Basic AI concepts", order=1)
    new_module = await create_uc.execute(payload)

    assert new_module.name == "Introduction to AI"
    assert new_module.description == "Basic AI concepts"
    assert new_module.order == 1
    assert isinstance(new_module.id, UUID)

    # 2. Add a lesson pointing to this module
    lesson = LessonEntity(
        id=uuid4(),
        name="What is ML?",
        description="ML basic concepts",
        order=1,
        slug="what-is-ml",
        created_at=now_ict(),
        module_id=new_module.id,
    )
    lesson_repo.lessons.append(lesson)

    # 3. List Modules with Lessons
    modules_list = await list_uc.execute()
    assert len(modules_list) == 1
    assert modules_list[0]["name"] == "Introduction to AI"
    assert len(modules_list[0]["lessons"]) == 1
    assert modules_list[0]["lessons"][0].name == "What is ML?"

    # 4. Update Module
    update_payload = ModuleUpdate(name="Intro to Machine Learning", order=2)
    updated_module = await update_uc.execute(str(new_module.id), update_payload)
    assert updated_module is not None
    assert updated_module.name == "Intro to Machine Learning"
    assert updated_module.order == 2
    assert updated_module.description == "Basic AI concepts"

    # 4b. Create second module and test reordering
    another_module = await create_uc.execute(
        ModuleCreate(name="Advanced Neural Networks", description="Deep learning", order=5)
    )
    reorder_payload = ModuleReorder(module_ids=[another_module.id, updated_module.id])
    await reorder_uc.execute(reorder_payload)

    ordered_modules = await module_repo.list_all()
    assert len(ordered_modules) == 2
    assert ordered_modules[0].id == another_module.id
    assert ordered_modules[0].order == 0
    assert ordered_modules[1].id == updated_module.id
    assert ordered_modules[1].order == 1

    # 4c. Test duplicate name prevention
    with pytest.raises(BadRequestException):
        await create_uc.execute(ModuleCreate(name="INTRO to Machine Learning"))

    # Test update to duplicate name fails
    with pytest.raises(BadRequestException):
        await update_uc.execute(str(another_module.id), ModuleUpdate(name="intro to machine learning"))

    # 4d. Test autocomplete suggest search
    suggestions = await list_uc.execute(q="adva", include_lessons=False)
    assert len(suggestions) == 1
    assert suggestions[0]["name"] == "Advanced Neural Networks"

    suggestions_empty = await list_uc.execute(q="nonexistent", include_lessons=False)
    assert len(suggestions_empty) == 0

    # 5. Delete Module
    delete_result = await delete_uc.execute(str(new_module.id))
    assert delete_result is True
    delete_result2 = await delete_uc.execute(str(another_module.id))
    assert delete_result2 is True
    assert len(await module_repo.list_all()) == 0
