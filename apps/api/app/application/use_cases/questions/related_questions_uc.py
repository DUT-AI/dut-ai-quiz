from app.application.services.question_embedding import (
    question_embedding_hash,
    question_embedding_text,
    question_query_embedding_text,
)
from app.domain.interfaces import (
    EmbeddingServiceError,
    IEmbeddingService,
    IQuestionRepository,
    IRerankService,
    QuestionSimilarityMatch,
)
from app.domain.value_objects import PoolType
from loguru import logger


class FindRelatedQuestionsUseCase:
    def __init__(
        self,
        question_repo: IQuestionRepository,
        embedding_service: IEmbeddingService,
        rerank_service: IRerankService | None = None,
    ) -> None:
        self._question_repo = question_repo
        self._embedding_service = embedding_service
        self._rerank_service = rerank_service

    async def _rerank_candidates(
        self, query: str, candidates: list[QuestionSimilarityMatch]
    ) -> list[QuestionSimilarityMatch]:
        if not candidates or self._rerank_service is None or not self._rerank_service.enabled:
            return candidates

        texts = [question_embedding_text(c.question) for c in candidates]
        try:
            rerank_results = await self._rerank_service.rerank(query=query, texts=texts)
            reranked: list[QuestionSimilarityMatch] = []
            for item in rerank_results:
                orig = candidates[item.index]
                reranked.append(
                    QuestionSimilarityMatch(
                        question=orig.question,
                        score=item.score,
                    )
                )
            return reranked
        except Exception as exc:
            logger.warning(
                "Reranking failed in related questions, falling back to vector score: {}", exc
            )
            return candidates

    async def execute(
        self,
        *,
        content: str,
        limit: int,
        min_score: float,
        pool_type: PoolType | None = None,
    ) -> list[dict]:
        normalized_content = content.strip()
        if not normalized_content:
            raise ValueError("Question content must not be empty")
        if not self._embedding_service.enabled:
            raise EmbeddingServiceError("Question embedding is not enabled")

        query_embedding = (
            await self._embedding_service.embed([question_query_embedding_text(normalized_content)])
        )[0]
        raw_candidates = await self._question_repo.search_similar(
            embedding=query_embedding,
            embedding_model=self._embedding_service.model_name,
            pool_type=pool_type,
            candidate_limit=max(limit * 5, 50),
        )

        valid_candidates = [
            match
            for match in raw_candidates
            if match.question.embedding_source_hash == question_embedding_hash(match.question)
        ]

        candidates = await self._rerank_candidates(normalized_content, valid_candidates)

        results: list[dict] = []
        for match in candidates:
            question = match.question
            if match.score < min_score:
                continue
            results.append(
                {
                    "id": question.id,
                    "content": question.content,
                    "pool_type": question.pool_type,
                    "difficulty": question.difficulty,
                    "options": [
                        {
                            "id": option.id,
                            "text": option.text,
                            "fixed": option.fixed,
                        }
                        for option in question.options
                    ],
                    "lesson_id": question.lesson_id,
                    "tags": question.tags,
                    "score": round(match.score, 6),
                }
            )
            if len(results) >= limit:
                break
        return results
