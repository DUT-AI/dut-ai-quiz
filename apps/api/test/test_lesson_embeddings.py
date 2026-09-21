import json
from datetime import datetime
from uuid import uuid4

import httpx
import pytest
from app.application.services.lesson_chunker import LessonChunker
from app.application.services.question_embedding import (
    QuestionEmbeddingService,
    question_embedding_hash,
)
from app.application.use_cases.questions.related_lessons_uc import (
    GetRelatedLessonsUseCase,
)
from app.config import Settings
from app.domain.entities.lesson_chunk import lesson_source_hash
from app.domain.entities.question import QuestionEntity, QuestionOptionEntity
from app.domain.value_objects import Difficulty, LessonChunkMatch, PoolType
from app.infrastructure.clients.embedding_service import (
    DutAiEmbeddingService,
    LocalHashingEmbeddingService,
)


def test_hierarchical_chunker_preserves_markdown_semantics() -> None:
    chunker = LessonChunker(target_tokens=100, max_tokens=180)
    content = r"""
# Kiến trúc Toán học Cốt lõi

## Patch Extraction

Một hình ảnh đầu vào được chia thành các patch.

$$
N = \frac{H \cdot W}{P^2}
$$

| Model | Layers | Params |
| --- | ---: | ---: |
| ViT-B | 12 | 86M |
| ViT-L | 24 | 307M |

![ViT Architecture](vit.png)

## Linear Projection

Mỗi patch được ánh xạ sang một vector riêng.
"""

    chunks = chunker.split(content)

    patch_chunks = [chunk for chunk in chunks if chunk.heading_path[-1] == "Patch Extraction"]
    projection_chunks = [
        chunk for chunk in chunks if chunk.heading_path[-1] == "Linear Projection"
    ]
    assert patch_chunks
    assert projection_chunks
    assert all("Linear Projection" not in chunk.content for chunk in patch_chunks)
    assert all("Patch Extraction" not in chunk.content for chunk in projection_chunks)

    patch_context = "\n".join(chunk.contextual_content for chunk in patch_chunks)
    assert "[H1] Kiến trúc Toán học Cốt lõi" in patch_context
    assert "[H2] Patch Extraction" in patch_context
    assert r"Original LaTeX: N = \frac{H \cdot W}{P^2}" in patch_context
    assert "Readable: N = (H * W) / P²" in patch_context
    assert "Model=ViT-B; Layers=12; Params=86M" in patch_context
    assert "caption: ViT Architecture" in patch_context
    assert "source: vit.png" in patch_context


def test_chunker_only_splits_oversized_paragraph_at_sentence_boundaries() -> None:
    chunker = LessonChunker(target_tokens=100, max_tokens=120)
    paragraph = " ".join(
        f"Đây là câu số {index} chứa kiến thức quan trọng."
        for index in range(80)
    )

    chunks = chunker.split(f"## Một section\n\n{paragraph}")

    assert len(chunks) > 1
    assert all(chunk.content.endswith(".") for chunk in chunks)
    assert all(chunk.heading_path == ("Một section",) for chunk in chunks)


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


@pytest.mark.asyncio
async def test_dutai_embedding_uses_model_id_and_validates_dimensions() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        payload = json.loads(request.content)
        assert payload == {
            "input": ["Công thức tính số patch trong ViT?"],
            "model_id": "keepitreal/vietnamese-sbert",
        }
        return httpx.Response(
            200,
            json={
                "object": "list",
                "data": [
                    {"object": "embedding", "embedding": [0.1, 0.2, 0.3], "index": 0}
                ],
                "model": "keepitreal/vietnamese-sbert",
            },
        )

    settings = Settings(
        _env_file=None,
        embedding_enabled=True,
        embedding_provider="dutai",
        embedding_api_url="https://embedding.dutai.site/v1/embeddings",
        embedding_model="keepitreal/vietnamese-sbert",
        embedding_dimensions=3,
    )
    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        service = DutAiEmbeddingService(client, settings)
        vectors = await service.embed(["Công thức tính số patch trong ViT?"])

    assert vectors == [[0.1, 0.2, 0.3]]


def make_question() -> QuestionEntity:
    return QuestionEntity(
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


class FakeQuestionRepository:
    def __init__(self, question: QuestionEntity) -> None:
        self.question = question

    async def get(self, question_id):
        return self.question if question_id == self.question.id else None


class FakeEmbeddingService:
    enabled = True
    model_name = "test-model"
    calls = 0

    async def embed(self, texts: list[str]) -> list[list[float]]:
        self.calls += 1
        return [[1.0, 0.0] for _ in texts]


class FakeChunkRepository:
    def __init__(self, matches: list[LessonChunkMatch]) -> None:
        self.matches = matches

    async def search(self, embedding, embedding_model, candidate_limit):
        assert embedding == [1.0, 0.0]
        assert embedding_model == "test-model"
        return self.matches


@pytest.mark.asyncio
async def test_related_lessons_uses_cached_question_embedding() -> None:
    question = make_question()
    embedding_service = FakeEmbeddingService()
    await QuestionEmbeddingService(embedding_service).prepare(question)
    assert embedding_service.calls == 1
    assert question.embedding_source_hash == question_embedding_hash(question)

    fresh_content = "# Batch normalization\nNội dung hiện tại"
    fresh_hash = lesson_source_hash(
        "Batch normalization", "Chuẩn hóa activation", fresh_content
    )
    lesson_id = uuid4()
    matches = [
        LessonChunkMatch(
            lesson_id=lesson_id,
            lesson_name="Batch normalization",
            lesson_description="Chuẩn hóa activation",
            lesson_slug="batch-normalization",
            lesson_content_md=fresh_content,
            chunk_content="Đoạn phù hợp nhất",
            heading_path=("Batch normalization",),
            source_hash=fresh_hash,
            score=0.91,
        )
    ]
    use_case = GetRelatedLessonsUseCase(
        FakeQuestionRepository(question),
        FakeChunkRepository(matches),
        embedding_service,
    )

    result = await use_case.execute(question.id, limit=3, min_score=0.25)

    assert result is not None
    assert [item["id"] for item in result] == [lesson_id]
    assert embedding_service.calls == 1  # no embedding call on the read endpoint


@pytest.mark.asyncio
async def test_related_lessons_rejects_stale_question_embedding() -> None:
    question = make_question()
    embedding_service = FakeEmbeddingService()
    await QuestionEmbeddingService(embedding_service).prepare(question)
    question.content = "Nội dung đã thay đổi"
    use_case = GetRelatedLessonsUseCase(
        FakeQuestionRepository(question), FakeChunkRepository([]), embedding_service
    )

    with pytest.raises(Exception, match="Question embedding is not ready"):
        await use_case.execute(question.id, limit=3, min_score=0.25)
