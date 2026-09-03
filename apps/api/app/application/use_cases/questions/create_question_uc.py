from uuid import uuid4

from app.core.datetime_utils import now_ict
from app.application.services.question_embedding import QuestionEmbeddingService
from app.domain.entities.question import QuestionEntity, QuestionOptionEntity
from app.domain.entities.tag import TagEntity
from app.domain.interfaces import IQuestionRepository, ITagRepository
from app.presentation.schemas.questions import QuestionBulkCreate, QuestionCreate


class CreateQuestionUseCase:
    def __init__(
        self,
        question_repo: IQuestionRepository,
        question_embedding: QuestionEmbeddingService,
    ):
        self._question_repo = question_repo
        self._question_embedding = question_embedding

    async def execute(self, payload: QuestionCreate) -> QuestionEntity:
        options = [
            QuestionOptionEntity(
                id=opt.id or str(uuid4()).split("-")[0],
                text=opt.text,
                is_correct=opt.is_correct,
                fixed=opt.fixed,
            )
            for opt in payload.options
        ]

        entity = QuestionEntity(
            id=uuid4(),
            lesson_id=payload.lesson_id,
            pool_type=payload.pool_type,
            difficulty=payload.difficulty,
            content=payload.content,
            options=options,
            solution=payload.solution,
            tags=payload.tags,
            created_by=payload.created_by or 1,
            created_at=now_ict(),
        )
        await self._question_embedding.prepare(entity)
        return await self._question_repo.add(entity)


class BulkCreateQuestionsUseCase:
    def __init__(
        self,
        question_repo: IQuestionRepository,
        tag_repo: ITagRepository,
        question_embedding: QuestionEmbeddingService,
    ):
        self._question_repo = question_repo
        self._tag_repo = tag_repo
        self._question_embedding = question_embedding

    async def execute(self, payload: QuestionBulkCreate) -> list[QuestionEntity]:
        # Collect all unique tag names
        all_tag_names = set()
        for item in payload.questions:
            for tag_name in item.tags:
                cleaned = tag_name.strip()
                if cleaned:
                    all_tag_names.add(cleaned)

        # Resolve tag names to UUIDs, creating them if they don't exist
        tag_name_to_uuid = {}
        for name in all_tag_names:
            existing = await self._tag_repo.get_by_name(name)
            if existing:
                tag_name_to_uuid[name] = existing.id
            else:
                new_tag = TagEntity(
                    id=uuid4(),
                    name=name,
                    created_at=now_ict(),
                )
                created = await self._tag_repo.add(new_tag)
                tag_name_to_uuid[name] = created.id

        entities: list[QuestionEntity] = []
        created_at = now_ict()

        for item in payload.questions:
            options: list[QuestionOptionEntity] = []
            for opt in item.options:
                options.append(
                    QuestionOptionEntity(
                        id=opt.id or str(uuid4()).split("-")[0],
                        text=opt.text,
                        is_correct=opt.is_correct,
                        fixed=opt.fixed,
                    )
                )

            # Map tag names to UUIDs
            item_tag_uuids = []
            for tag_name in item.tags:
                cleaned = tag_name.strip()
                if cleaned in tag_name_to_uuid:
                    item_tag_uuids.append(tag_name_to_uuid[cleaned])

            # If tags are specified in the JSON item, use them. Otherwise fall back to batch-level tags.
            tags = item_tag_uuids if item.tags else payload.tags

            entities.append(
                QuestionEntity(
                    id=uuid4(),
                    lesson_id=payload.lesson_id,
                    pool_type=item.pool_type or payload.pool_type,
                    difficulty=item.difficulty or payload.difficulty,
                    content=item.question,
                    options=options,
                    solution=item.solution,
                    tags=tags,
                    created_by=payload.created_by or 1,
                    created_at=created_at,
                )
            )

        await self._question_embedding.prepare_many(entities)
        return await self._question_repo.add_bulk(entities)
