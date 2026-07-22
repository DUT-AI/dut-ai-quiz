from uuid import uuid4

from app.domain.entities.lesson import LessonEntity
from app.domain.entities.lesson_chunk import LessonChunkEntity, lesson_source_hash
from app.domain.interfaces import IEmbeddingService, ILessonChunkRepository

from .lesson_chunker import LessonChunker


class LessonEmbeddingIndexer:
    """Build and persist a complete searchable index for one lesson."""

    def __init__(
        self,
        chunk_repo: ILessonChunkRepository,
        embedding_service: IEmbeddingService,
        chunker: LessonChunker,
    ) -> None:
        self._chunk_repo = chunk_repo
        self._embedding_service = embedding_service
        self._chunker = chunker

    async def index(self, lesson: LessonEntity) -> int:
        content = lesson.content_md or ""
        drafts = self._chunker.split(content)
        if not drafts:
            await self._chunk_repo.delete_for_lesson(lesson.id)
            return 0

        document_context = (
            f"[DOCUMENT] {lesson.name}\n"
            f"[DESCRIPTION] {lesson.description}\n"
            f"[SLUG] {lesson.slug or ''}\n\n"
        )
        embedding_inputs = [
            f"{document_context}{draft.contextual_content}" for draft in drafts
        ]
        vectors = await self._embedding_service.embed(embedding_inputs)
        source_hash = lesson_source_hash(lesson.name, lesson.description, content)
        entities = [
            LessonChunkEntity(
                id=uuid4(),
                lesson_id=lesson.id,
                chunk_index=index,
                content=draft.content,
                contextual_content=embedding_input,
                heading_path=draft.heading_path,
                token_count=draft.token_count,
                metadata={
                    **draft.metadata,
                    "document": lesson.slug or str(lesson.id),
                    "lesson_name": lesson.name,
                    "chunk_id": index,
                },
                source_hash=source_hash,
                embedding=vector,
                embedding_model=self._embedding_service.model_name,
            )
            for index, (draft, embedding_input, vector) in enumerate(
                zip(drafts, embedding_inputs, vectors, strict=True)
            )
        ]
        await self._chunk_repo.replace_for_lesson(lesson.id, entities)
        return len(entities)
