from uuid import UUID

from app.application.services.question_embedding import question_embedding_hash
from app.domain.entities.lesson_chunk import lesson_source_hash
from app.domain.interfaces import (
    EmbeddingServiceError,
    IEmbeddingService,
    ILessonChunkRepository,
    IQuestionRepository,
)
from app.domain.value_objects import LessonChunkMatch, PoolType


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

    async def _search_matches(
        self, question_id: UUID, candidate_limit: int
    ) -> list[LessonChunkMatch] | None:
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

        return await self._chunk_repo.search(
            question.embedding,
            question.embedding_model,
            candidate_limit=candidate_limit,
        )

    @staticmethod
    def _is_current(match: LessonChunkMatch, min_score: float) -> bool:
        return match.score >= min_score and match.source_hash == lesson_source_hash(
            match.lesson_name,
            match.lesson_description,
            match.lesson_content_md,
        )

    async def execute(
        self, question_id: UUID, limit: int, min_score: float
    ) -> list[dict] | None:
        candidates = await self._search_matches(question_id, max(limit * 12, 30))
        if candidates is None:
            return None

        results: list[dict] = []
        seen: set[UUID] = set()
        for match in candidates:
            if match.lesson_id in seen or not self._is_current(match, min_score):
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

    async def get_relative_document(
        self, question_id: UUID, limit: int, min_score: float
    ) -> list[dict] | None:
        candidates = await self._search_matches(question_id, max(limit * 30, 100))
        if candidates is None:
            return None

        documents: dict[UUID, dict] = {}
        for match in candidates:
            if not match.lesson_content_md or not self._is_current(match, min_score):
                continue
            if match.lesson_id not in documents:
                if len(documents) >= limit:
                    continue
                documents[match.lesson_id] = {
                    "document_title": match.lesson_name,
                    "full_md": match.lesson_content_md,
                    "relative_chunk": [],
                }
            chunks = documents[match.lesson_id]["relative_chunk"]
            if match.chunk_content and match.chunk_content not in chunks:
                chunks.append(match.chunk_content)
        return list(documents.values())
