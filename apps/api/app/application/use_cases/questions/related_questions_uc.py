from app.application.services.question_embedding import (
    question_embedding_hash,
    question_query_embedding_text,
)
from app.domain.interfaces import (
    EmbeddingServiceError,
    IEmbeddingService,
    IQuestionRepository,
)
from app.domain.value_objects import PoolType


class FindRelatedQuestionsUseCase:
    def __init__(
        self,
        question_repo: IQuestionRepository,
        embedding_service: IEmbeddingService,
    ) -> None:
        self._question_repo = question_repo
        self._embedding_service = embedding_service

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
            await self._embedding_service.embed(
                [question_query_embedding_text(normalized_content)]
            )
        )[0]
        candidates = await self._question_repo.search_similar(
            embedding=query_embedding,
            embedding_model=self._embedding_service.model_name,
            pool_type=pool_type,
            candidate_limit=max(limit * 5, 50),
        )

        results: list[dict] = []
        for match in candidates:
            question = match.question
            if match.score < min_score:
                continue
            if question.embedding_source_hash != question_embedding_hash(question):
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
