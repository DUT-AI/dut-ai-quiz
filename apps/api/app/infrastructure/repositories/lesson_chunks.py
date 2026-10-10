from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.lesson_chunk import LessonChunkEntity
from app.domain.interfaces import ILessonChunkRepository
from app.domain.value_objects import LessonChunkMatch
from app.infrastructure.persistence.models import Lesson, LessonChunk


class LessonChunkRepository(ILessonChunkRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def replace_for_lesson(self, lesson_id: UUID, chunks: list[LessonChunkEntity]) -> None:
        await self.delete_for_lesson(lesson_id)
        self._session.add_all(
            [
                LessonChunk(
                    id=chunk.id,
                    lesson_id=chunk.lesson_id,
                    chunk_index=chunk.chunk_index,
                    content=chunk.content,
                    contextual_content=chunk.contextual_content,
                    heading_path=list(chunk.heading_path),
                    token_count=chunk.token_count,
                    chunk_metadata=chunk.metadata,
                    source_hash=chunk.source_hash,
                    embedding=chunk.embedding,
                    embedding_model=chunk.embedding_model,
                )
                for chunk in chunks
            ]
        )
        await self._session.flush()

    async def delete_for_lesson(self, lesson_id: UUID) -> None:
        await self._session.execute(delete(LessonChunk).where(LessonChunk.lesson_id == lesson_id))
        await self._session.flush()

    async def search(
        self,
        embedding: list[float],
        embedding_model: str,
        candidate_limit: int,
    ) -> list[LessonChunkMatch]:
        distance = LessonChunk.embedding.cosine_distance(embedding)
        stmt = (
            select(Lesson, LessonChunk, (1 - distance).label("score"))
            .join(Lesson, Lesson.id == LessonChunk.lesson_id)
            .where(LessonChunk.embedding_model == embedding_model)
            .order_by(distance)
            .limit(candidate_limit)
        )
        rows = (await self._session.execute(stmt)).all()
        return [
            LessonChunkMatch(
                lesson_id=lesson.id,
                lesson_name=lesson.name,
                lesson_description=lesson.description,
                lesson_slug=lesson.slug,
                lesson_content_md=lesson.content_md,
                chunk_content=chunk.content,
                heading_path=tuple(chunk.heading_path),
                source_hash=chunk.source_hash,
                score=float(score),
            )
            for lesson, chunk, score in rows
        ]
