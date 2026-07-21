from uuid import UUID
import math

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.lesson_chunk import LessonChunkEntity, LessonChunkMatch
from app.domain.interfaces import ILessonChunkRepository
from app.infrastructure.persistence.models import Lesson, LessonChunk


class LessonChunkRepository(ILessonChunkRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def replace_for_lesson(
        self, lesson_id: UUID, chunks: list[LessonChunkEntity]
    ) -> None:
        await self.delete_for_lesson(lesson_id)
        self._session.add_all(
            [
                LessonChunk(
                    id=chunk.id,
                    lesson_id=chunk.lesson_id,
                    chunk_index=chunk.chunk_index,
                    content=chunk.content,
                    source_hash=chunk.source_hash,
                    embedding=chunk.embedding,
                    embedding_model=chunk.embedding_model,
                )
                for chunk in chunks
            ]
        )
        await self._session.flush()

    async def delete_for_lesson(self, lesson_id: UUID) -> None:
        await self._session.execute(
            delete(LessonChunk).where(LessonChunk.lesson_id == lesson_id)
        )
        await self._session.flush()

    async def search(
        self,
        embedding: list[float],
        embedding_model: str,
        candidate_limit: int,
    ) -> list[LessonChunkMatch]:
        stmt = (
            select(Lesson, LessonChunk)
            .join(Lesson, Lesson.id == LessonChunk.lesson_id)
            .where(LessonChunk.embedding_model == embedding_model)
        )
        rows = (await self._session.execute(stmt)).all()
        matches = [
            LessonChunkMatch(
                lesson_id=lesson.id,
                lesson_name=lesson.name,
                lesson_description=lesson.description,
                lesson_slug=lesson.slug,
                lesson_content_md=lesson.content_md,
                chunk_content=chunk.content,
                source_hash=chunk.source_hash,
                score=self._cosine_similarity(embedding, chunk.embedding),
            )
            for lesson, chunk in rows
        ]
        matches.sort(key=lambda match: match.score, reverse=True)
        return matches[:candidate_limit]

    @staticmethod
    def _cosine_similarity(left: list[float], right: list[float]) -> float:
        if len(left) != len(right) or not left:
            return -1.0
        dot = sum(a * b for a, b in zip(left, right, strict=True))
        left_norm = math.sqrt(sum(value * value for value in left))
        right_norm = math.sqrt(sum(value * value for value in right))
        if left_norm == 0 or right_norm == 0:
            return -1.0
        return dot / (left_norm * right_norm)
