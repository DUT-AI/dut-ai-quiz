from uuid import UUID

from app.application.services.question_embedding import question_embedding_hash
from app.domain.entities.lesson_chunk import lesson_source_hash
from app.domain.interfaces import (
    EmbeddingServiceError,
    IEmbeddingService,
    ILessonChunkRepository,
    IQuestionRepository,
)
from app.domain.value_objects import PoolType


class GetRelatedLessonsUseCase:
    def __init__(
        self,
        question_repo: IQuestionRepository,
        chunk_repo: ILessonChunkRepository,
        embedding_service: IEmbeddingService,
    ) -> None:
        self._question_repo = question_repo
        self._chunk_repo = chunk_repo
        self._embedding_service = embedding_service

    async def execute(self, question_id: UUID, limit: int, min_score: float) -> list[dict] | None:
        question = await self._question_repo.get(question_id)
        if question is None:
            return None
        if question.pool_type != PoolType.PRACTICE:
            raise ValueError("Related lessons are only available for practice questions")
        if not self._embedding_service.enabled:
            raise EmbeddingServiceError("Lesson embedding is not enabled")
        if (
            question.embedding is None
            or question.embedding_model != self._embedding_service.model_name
            or question.embedding_source_hash != question_embedding_hash(question)
        ):
            raise EmbeddingServiceError(
                "Question embedding is not ready; save the question again to index it"
            )

        candidates = await self._chunk_repo.search(
            question.embedding,
            question.embedding_model,
            candidate_limit=max(limit * 12, 30),
        )

        results: list[dict] = []
        seen: set[UUID] = set()
        for match in candidates:
            current_hash = lesson_source_hash(
                match.lesson_name,
                match.lesson_description,
                match.lesson_content_md,
            )
            if match.source_hash != current_hash:
                continue
            if match.lesson_id in seen or match.score < min_score:
                continue
            seen.add(match.lesson_id)
            results.append(
                {
                    "id": match.lesson_id,
                    "name": match.lesson_name,
                    "description": match.lesson_description,
                    "slug": match.lesson_slug,
                    "score": round(match.score, 6),
                    "matched_chunk": match.chunk_content,
                }
            )
            if len(results) >= limit:
                break
        return results
