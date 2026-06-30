from uuid import uuid4

from app.core.datetime_utils import now_ict
from app.domain.entities.lesson import LessonEntity
from app.infrastructure.clients.blog_service import BlogServiceClient
from app.infrastructure.repositories.lessons import LessonRepository
from app.infrastructure.repositories.questions import QuestionRepository
from app.presentation.schemas.lessons import LessonCreate, LessonUpdate


class ListLessonsUseCase:
    def __init__(self, repo: LessonRepository) -> None:
        self._repo = repo

    async def execute(self) -> list[LessonEntity]:
        return await self._repo.list_all()


class GetLessonDetailUseCase:
    def __init__(
        self, 
        lesson_repo: LessonRepository, 
        question_repo: QuestionRepository
    ) -> None:
        self._lesson_repo = lesson_repo
        self._question_repo = question_repo

    async def execute(self, lesson_id: str, is_teacher: bool = False) -> dict | None:
        from app.domain.value_objects import PoolType
        from uuid import UUID
        
        try:
            lid = UUID(lesson_id)
        except ValueError:
            return None
            
        lesson = await self._lesson_repo.get(lid)
        if not lesson:
            return None

        # Only show PRACTICE questions for students.
        pool_type = None if is_teacher else PoolType.PRACTICE
        questions = await self._question_repo.list_all(lesson_id=lid, pool_type=pool_type)

        return {
            "id": lesson.id,
            "name": lesson.name,
            "description": lesson.description,
            "content_md": lesson.content_md,
            "order": lesson.order,
            "slug": lesson.slug,
            "blog_id": lesson.blog_id,
            "created_at": lesson.created_at,
            "questions": questions,
        }


class CreateLessonUseCase:
    def __init__(
        self, 
        repo: LessonRepository,
        blog_client: BlogServiceClient
    ) -> None:
        self._repo = repo
        self._blog_client = blog_client

    async def execute(self, payload: LessonCreate) -> LessonEntity:
        # Nếu có blog_id, tự động fetch content từ blog service
        name = payload.name
        description = payload.description
        content_md = payload.content_md
        slug = payload.slug
        
        if payload.blog_id:
            blog_detail = await self._blog_client.get_blog_by_id(payload.blog_id)
            if blog_detail:
                # Override với data từ blog nếu có
                name = blog_detail.get("title", name) or name
                description = blog_detail.get("summary", description) or blog_detail.get("excerpt", description) or description
                content_md = blog_detail.get("content", content_md) or content_md
                if not slug:
                    slug = blog_detail.get("slug")
        
        entity = LessonEntity(
            id=uuid4(),
            name=name,
            description=description,
            content_md=content_md,
            order=payload.order,
            slug=slug,
            blog_id=payload.blog_id,
            created_at=now_ict(),
        )
        return await self._repo.add(entity)


class UpdateLessonUseCase:
    def __init__(
        self, 
        repo: LessonRepository,
        blog_client: BlogServiceClient
    ) -> None:
        self._repo = repo
        self._blog_client = blog_client

    async def execute(
        self, lesson_id: str, payload: LessonUpdate
    ) -> LessonEntity | None:
        from uuid import UUID
        entity = await self._repo.get(UUID(lesson_id))
        if not entity:
            return None

        # Nếu blog_id được update, fetch content mới từ blog
        if payload.blog_id and payload.blog_id != entity.blog_id:
            blog_detail = await self._blog_client.get_blog_by_id(payload.blog_id)
            if blog_detail:
                entity.name = blog_detail.get("title", entity.name)
                entity.description = blog_detail.get("summary", entity.description) or blog_detail.get("excerpt", entity.description)
                entity.content_md = blog_detail.get("content", entity.content_md)
                entity.slug = blog_detail.get("slug", entity.slug)
                entity.blog_id = payload.blog_id
        else:
            # Update thủ công các field
            if payload.name is not None:
                entity.name = payload.name
            if payload.description is not None:
                entity.description = payload.description
            if payload.content_md is not None:
                entity.content_md = payload.content_md
            if payload.order is not None:
                entity.order = payload.order
            if payload.slug is not None:
                entity.slug = payload.slug
            if payload.blog_id is not None:
                entity.blog_id = payload.blog_id

        return await self._repo.update(entity)


class DeleteLessonUseCase:
    def __init__(self, repo: LessonRepository) -> None:
        self._repo = repo

    async def execute(self, lesson_id: str) -> bool:
        from uuid import UUID
        from sqlalchemy.exc import IntegrityError
        
        entity = await self._repo.get(UUID(lesson_id))
        if not entity:
            return False
        
        try:
            await self._repo.delete(entity)
            return True
        except IntegrityError as e:
            # Foreign key constraint violation
            if "questions_lesson_id_fkey" in str(e):
                raise ValueError(
                    "Cannot delete lesson because it has associated questions. "
                    "Please delete all questions first or set their lesson_id to NULL."
                )
            raise