from datetime import datetime
from uuid import uuid4

import pytest

from app.application.services.lesson_chunker import LessonChunker
from app.application.use_cases.questions.related_lessons_uc import (
    GetRelatedLessonsUseCase,
)
from app.domain.entities.lesson_chunk import LessonChunkMatch, lesson_source_hash
from app.domain.entities.question import QuestionEntity, QuestionOptionEntity
from app.domain.value_objects import Difficulty, PoolType
from app.infrastructure.repositories.lesson_chunks import LessonChunkRepository
from app.infrastructure.clients.embedding_service import (
    LocalHashingEmbeddingService,
)
from app.config import Settings


def test_lesson_chunker_splits_large_content_with_overlap() -> None:
    chunker = LessonChunker(max_chars=200, overlap_chars=40)
    content = "\n\n".join(["Đoạn kiến thức " + (str(i) + " ") * 35 for i in range(5)])

    chunks = chunker.split(content)

    assert len(chunks) > 1
    assert all(chunk.strip() for chunk in chunks)
    assert all(len(chunk) <= 240 for chunk in chunks)


def test_cosine_similarity_for_portable_array_storage() -> None:
    cosine = LessonChunkRepository._cosine_similarity

    assert cosine([1.0, 0.0], [1.0, 0.0]) == pytest.approx(1.0)
    assert cosine([1.0, 0.0], [0.0, 1.0]) == pytest.approx(0.0)
    assert cosine([1.0], [1.0, 0.0]) == -1.0


@pytest.mark.asyncio
async def test_local_embedding_works_without_api_key() -> None:
    settings = Settings(
        _env_file=None,
        embedding_enabled=True,
        embedding_provider="local",
        embedding_dimensions=64,
        embedding_api_key="",
    )
    service = LocalHashingEmbeddingService(settings)

    vectors = await service.embed(["mạng neural tích chập", "mạng neural tích chập"])

    assert service.enabled is True
    assert service.model_name == "local-hashing-v1-64"
    assert len(vectors[0]) == 64
    assert vectors[0] == vectors[1]
    assert sum(value * value for value in vectors[0]) == pytest.approx(1.0)


class FakeQuestionRepository:
    def __init__(self, question: QuestionEntity) -> None:
        self.question = question

    async def get(self, question_id):
        return self.question if question_id == self.question.id else None


class FakeEmbeddingService:
    enabled = True
    model_name = "test-model"

    async def embed(self, texts: list[str]) -> list[list[float]]:
        assert "Câu hỏi:" in texts[0]
        return [[1.0, 0.0]]


class FakeChunkRepository:
    def __init__(self, matches: list[LessonChunkMatch]) -> None:
        self.matches = matches

    async def search(self, embedding, embedding_model, candidate_limit):
        assert embedding == [1.0, 0.0]
        assert embedding_model == "test-model"
        return self.matches


@pytest.mark.asyncio
async def test_related_lessons_groups_chunks_and_ignores_stale_embeddings() -> None:
    question = QuestionEntity(
        id=uuid4(),
        pool_type=PoolType.PRACTICE,
        difficulty=Difficulty.EASY,
        content="Batch normalization dùng để làm gì?",
        options=[QuestionOptionEntity("a", "Ổn định phân phối", True)],
        solution=None,
        lesson_id=None,
        tags=[],
        created_by=1,
        created_at=datetime.now(),
    )
    fresh_content = "# Batch normalization\nNội dung hiện tại"
    fresh_hash = lesson_source_hash(
        "Batch normalization", "Chuẩn hóa activation", fresh_content
    )
    first_id = uuid4()
    stale_id = uuid4()
    matches = [
        LessonChunkMatch(
            lesson_id=first_id,
            lesson_name="Batch normalization",
            lesson_description="Chuẩn hóa activation",
            lesson_slug="batch-normalization",
            lesson_content_md=fresh_content,
            chunk_content="Đoạn phù hợp nhất",
            source_hash=fresh_hash,
            score=0.91,
        ),
        # A second chunk from the same lesson must not duplicate the lesson.
        LessonChunkMatch(
            lesson_id=first_id,
            lesson_name="Batch normalization",
            lesson_description="Chuẩn hóa activation",
            lesson_slug="batch-normalization",
            lesson_content_md=fresh_content,
            chunk_content="Đoạn phù hợp thứ hai",
            source_hash=fresh_hash,
            score=0.88,
        ),
        LessonChunkMatch(
            lesson_id=stale_id,
            lesson_name="Stale lesson",
            lesson_description="",
            lesson_slug="stale",
            lesson_content_md="Nội dung đã sửa",
            chunk_content="Embedding cũ",
            source_hash="0" * 64,
            score=0.99,
        ),
    ]
    use_case = GetRelatedLessonsUseCase(
        FakeQuestionRepository(question),
        FakeChunkRepository(matches),
        FakeEmbeddingService(),
    )

    result = await use_case.execute(question.id, limit=3, min_score=0.25)

    assert result is not None
    assert [item["id"] for item in result] == [first_id]
    assert result[0]["matched_chunk"] == "Đoạn phù hợp nhất"
