from datetime import datetime
from uuid import uuid4

import pytest
from app.application.services.question_embedding import question_embedding_hash
from app.application.use_cases.questions.related_questions_uc import (
    FindRelatedQuestionsUseCase,
)
from app.domain.entities.question import QuestionEntity, QuestionOptionEntity
from app.domain.interfaces import EmbeddingServiceError, QuestionSimilarityMatch
from app.domain.value_objects import Difficulty, PoolType
from app.presentation.schemas.questions import RelatedQuestionsIn


class FakeEmbeddingService:
    enabled = True
    model_name = "test-model"

    def __init__(self) -> None:
        self.inputs: list[str] = []

    async def embed(self, texts: list[str]) -> list[list[float]]:
        self.inputs.extend(texts)
        return [[1.0, 0.0]]


class FakeQuestionRepository:
    def __init__(self, matches: list[QuestionSimilarityMatch]) -> None:
        self.matches = matches
        self.search_args: dict | None = None

    async def search_similar(self, **kwargs) -> list[QuestionSimilarityMatch]:
        self.search_args = kwargs
        return self.matches


def make_question(content: str) -> QuestionEntity:
    question = QuestionEntity(
        id=uuid4(),
        pool_type=PoolType.PRACTICE,
        difficulty=Difficulty.EASY,
        content=content,
        options=[
            QuestionOptionEntity(
                id="a",
                text="Đáp án mẫu",
                is_correct=True,
            )
        ],
        solution="Lời giải không được trả ra API",
        lesson_id=None,
        tags=["machine-learning"],
        created_by=1,
        created_at=datetime.now(),
        embedding=[1.0, 0.0],
        embedding_model="test-model",
    )
    question.embedding_source_hash = question_embedding_hash(question)
    return question


@pytest.mark.asyncio
async def test_related_questions_embeds_input_and_returns_safe_ranked_results() -> None:
    strong = make_question("Batch normalization dùng để làm gì?")
    weak = make_question("Một câu hỏi không liên quan")
    stale = make_question("Nội dung embedding cũ")
    stale.content = "Nội dung đã thay đổi"
    repository = FakeQuestionRepository(
        [
            QuestionSimilarityMatch(strong, 0.91),
            QuestionSimilarityMatch(stale, 0.88),
            QuestionSimilarityMatch(weak, 0.2),
        ]
    )
    embedding_service = FakeEmbeddingService()
    use_case = FindRelatedQuestionsUseCase(repository, embedding_service)

    result = await use_case.execute(
        content="  Batch normalization  ",
        limit=5,
        min_score=0.5,
        pool_type=PoolType.PRACTICE,
    )

    assert embedding_service.inputs == ["Question: Batch normalization"]
    assert repository.search_args == {
        "embedding": [1.0, 0.0],
        "embedding_model": "test-model",
        "pool_type": PoolType.PRACTICE,
        "candidate_limit": 50,
    }
    assert result == [
        {
            "id": strong.id,
            "content": strong.content,
            "pool_type": strong.pool_type,
            "difficulty": strong.difficulty,
            "options": [
                {
                    "id": "a",
                    "text": "Đáp án mẫu",
                    "fixed": False,
                }
            ],
            "lesson_id": None,
            "tags": ["machine-learning"],
            "score": 0.91,
        }
    ]
    assert "solution" not in result[0]
    assert "is_correct" not in result[0]["options"][0]


@pytest.mark.asyncio
async def test_related_questions_rejects_disabled_embedding() -> None:
    embedding_service = FakeEmbeddingService()
    embedding_service.enabled = False
    use_case = FindRelatedQuestionsUseCase(FakeQuestionRepository([]), embedding_service)

    with pytest.raises(EmbeddingServiceError, match="not enabled"):
        await use_case.execute(
            content="Batch normalization",
            limit=5,
            min_score=0.5,
        )


def test_related_questions_input_trims_and_rejects_blank_content() -> None:
    assert RelatedQuestionsIn(content="  CNN là gì?  ").content == "CNN là gì?"
    with pytest.raises(ValueError):
        RelatedQuestionsIn(content="   ")
