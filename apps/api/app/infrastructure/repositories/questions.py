from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.question import QuestionEntity, QuestionStatus
from app.domain.interfaces import IQuestionRepository, QuestionSimilarityMatch
from app.domain.value_objects import Difficulty, PoolType
from app.infrastructure.persistence.models import Question, Tag


class QuestionRepository(IQuestionRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._s = session

    async def _resolve_tag_names(self, tag_ids_list: list[list[UUID]]) -> dict[UUID, str]:
        unique_ids = set()
        for ids in tag_ids_list:
            if ids:
                unique_ids.update(ids)

        if not unique_ids:
            return {}

        stmt = select(Tag.id, Tag.name).where(Tag.id.in_(unique_ids))
        res = await self._s.execute(stmt)
        return {row.id: row.name for row in res}

    async def get(self, question_id: UUID) -> QuestionEntity | None:
        r = await self._s.execute(select(Question).where(Question.id == question_id))
        model = r.scalar_one_or_none()
        if not model:
            return None
        tag_map = await self._resolve_tag_names([model.tags])
        entity = model.to_entity()
        entity.tags = [tag_map[tid] for tid in model.tags if tid in tag_map]
        return entity

    async def list_all(
        self,
        *,
        pool_type: PoolType | None = None,
        difficulty: Difficulty | None = None,
        lesson_id: UUID | None = None,
        import_session_id: UUID | None = None,
        tag: str | None = None,
        status: QuestionStatus | None = None,
        related_questions: bool | None = None,
        offset: int = 0,
        limit: int = 50,
    ) -> list[QuestionEntity]:
        from sqlalchemy.orm import aliased

        PublicQuestion = aliased(Question)
        distance = Question.embedding.cosine_distance(PublicQuestion.embedding)
        has_dup_exists = select(1).where(
            PublicQuestion.status == "PUBLIC",
            PublicQuestion.id != Question.id,
            PublicQuestion.embedding.is_not(None),
            PublicQuestion.embedding_model == Question.embedding_model,
            (1 - distance) >= 0.85
        ).exists()

        stmt = select(Question, has_dup_exists.label("has_duplicate"))
        if related_questions:
            stmt = stmt.where(has_dup_exists)

        if pool_type is not None:
            stmt = stmt.where(Question.pool_type == pool_type)
        if difficulty is not None:
            stmt = stmt.where(Question.difficulty == difficulty)
        if lesson_id:
            stmt = stmt.where(Question.lesson_id == lesson_id)
        if import_session_id:
            stmt = stmt.where(Question.import_session_id == import_session_id)
        if status is not None:
            stmt = stmt.where(Question.status == status)
        if tag:
            # tag can be name (string) or UUID string
            tag_uuid = None
            from uuid import UUID as pyUUID
            try:
                tag_uuid = pyUUID(tag)
            except ValueError:
                # search by name
                tag_stmt = select(Tag.id).where(Tag.name == tag)
                tag_res = await self._s.execute(tag_stmt)
                tag_uuid = tag_res.scalar_one_or_none()

            if tag_uuid:
                stmt = stmt.where(func.array_position(Question.tags, tag_uuid).isnot(None))
            else:
                # tag not found, force empty result
                from uuid import uuid4
                stmt = stmt.where(func.array_position(Question.tags, uuid4()).isnot(None))

        stmt = (
            stmt.order_by(Question.created_at.desc(), Question.id.desc())
            .offset(offset)
            .limit(limit)
        )
        r = await self._s.execute(stmt)
        rows = r.all()

        models = [row[0] for row in rows]
        tag_map = await self._resolve_tag_names([m.tags for m in models])

        entities = []
        for model, has_duplicate in rows:
            ent = model.to_entity()
            ent.tags = [tag_map[tid] for tid in model.tags if tid in tag_map]
            if has_duplicate:
                from app.domain.entities.question import DuplicateStatus
                ent.duplicate_status = DuplicateStatus.POSSIBLE_DUPLICATE
            entities.append(ent)
        return entities

    async def add(self, entity: QuestionEntity) -> QuestionEntity:
        from uuid import UUID as pyUUID
        tag_uuids = []
        for t in entity.tags:
            if isinstance(t, str):
                try:
                    tag_uuids.append(pyUUID(t))
                except ValueError:
                    pass
            elif isinstance(t, pyUUID):
                tag_uuids.append(t)

        model = Question.from_entity(entity)
        model.tags = tag_uuids
        self._s.add(model)
        await self._s.flush()
        await self._s.refresh(model)

        tag_map = await self._resolve_tag_names([model.tags])
        res_entity = model.to_entity()
        res_entity.tags = [tag_map[tid] for tid in model.tags if tid in tag_map]
        return res_entity

    async def add_bulk(self, entities: list[QuestionEntity]) -> list[QuestionEntity]:
        from uuid import UUID as pyUUID
        models = []
        for e in entities:
            tag_uuids = []
            for t in e.tags:
                if isinstance(t, str):
                    try:
                        tag_uuids.append(pyUUID(t))
                    except ValueError:
                        pass
                elif isinstance(t, pyUUID):
                    tag_uuids.append(t)

            model = Question.from_entity(e)
            model.tags = tag_uuids
            models.append(model)

        self._s.add_all(models)
        await self._s.flush()
        for model in models:
            await self._s.refresh(model)

        all_tags = [m.tags for m in models]
        tag_map = await self._resolve_tag_names(all_tags)

        res_entities = []
        for model in models:
            ent = model.to_entity()
            ent.tags = [tag_map[tid] for tid in model.tags if tid in tag_map]
            res_entities.append(ent)
        return res_entities

    async def update(self, entity: QuestionEntity) -> QuestionEntity:
        r = await self._s.execute(select(Question).where(Question.id == entity.id))
        model = r.scalar_one_or_none()
        if model:
            model.pool_type = entity.pool_type
            model.difficulty = entity.difficulty
            model.status = entity.status
            model.content = entity.content
            model.options = [opt.to_dict() for opt in entity.options]
            model.solution = entity.solution
            model.is_solution_ai_generated = entity.is_solution_ai_generated
            model.import_session_id = entity.import_session_id
            model.lesson_id = entity.lesson_id
            model.embedding = entity.embedding
            model.embedding_model = entity.embedding_model
            model.embedding_source_hash = entity.embedding_source_hash

            from uuid import UUID as pyUUID
            tag_uuids = []
            for t in entity.tags:
                if isinstance(t, str):
                    try:
                        tag_uuids.append(pyUUID(t))
                    except ValueError:
                        pass
                elif isinstance(t, pyUUID):
                    tag_uuids.append(t)
            model.tags = tag_uuids

            await self._s.flush()
            await self._s.refresh(model)

            tag_map = await self._resolve_tag_names([model.tags])
            res_entity = model.to_entity()
            res_entity.tags = [tag_map[tid] for tid in model.tags if tid in tag_map]
            return res_entity
        raise ValueError("Question not found")

    async def delete(self, entity: QuestionEntity) -> None:
        r = await self._s.execute(select(Question).where(Question.id == entity.id))
        model = r.scalar_one_or_none()
        if model:
            await self._s.delete(model)

    async def search_similar(
        self,
        *,
        embedding: list[float],
        embedding_model: str,
        pool_type: PoolType | None = None,
        candidate_limit: int = 50,
    ) -> list[QuestionSimilarityMatch]:
        distance = Question.embedding.cosine_distance(embedding)
        stmt = select(Question, (1 - distance).label("score")).where(
            Question.status == "PUBLIC",
            Question.embedding.is_not(None),
            Question.embedding_model == embedding_model,
        )
        if pool_type is not None:
            stmt = stmt.where(Question.pool_type == pool_type)
        stmt = stmt.order_by(distance).limit(candidate_limit)

        rows = (await self._s.execute(stmt)).all()
        models = [model for model, _ in rows]
        tag_map = await self._resolve_tag_names([model.tags for model in models])

        matches: list[QuestionSimilarityMatch] = []
        for model, score in rows:
            question = model.to_entity()
            question.tags = [
                tag_map[tag_id] for tag_id in model.tags if tag_id in tag_map
            ]
            matches.append(
                QuestionSimilarityMatch(question=question, score=float(score))
            )
        return matches
