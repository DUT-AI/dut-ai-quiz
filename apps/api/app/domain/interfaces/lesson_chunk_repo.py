from typing import Protocol
from uuid import UUID

from app.domain.entities.lesson_chunk import LessonChunkEntity, LessonChunkMatch


class ILessonChunkRepository(Protocol):
    async def replace_for_lesson(
        self, lesson_id: UUID, chunks: list[LessonChunkEntity]
    ) -> None: ...

    async def delete_for_lesson(self, lesson_id: UUID) -> None: ...

    async def search(
        self,
        embedding: list[float],
        embedding_model: str,
        candidate_limit: int,
    ) -> list[LessonChunkMatch]: ...
