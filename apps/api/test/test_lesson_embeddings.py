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
from app.domain.interfaces.rerank_service import RerankItem
from app.domain.value_objects import Difficulty, LessonChunkMatch, PoolType
from app.infrastructure.clients.embedding_service import (
    DutAiEmbeddingService,
    LocalHashingEmbeddingService,
)
from app.infrastructure.clients.rerank_service import (
    DisabledRerankService,
    DutAiRerankService,
    LocalRerankService,
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
    projection_chunks = [chunk for chunk in chunks if chunk.heading_path[-1] == "Linear Projection"]
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
    paragraph = " ".join(f"Đây là câu số {index} chứa kiến thức quan trọng." for index in range(80))

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
async def test_dutai_tei_native_embed_endpoint() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.headers["Authorization"] == "Bearer test-api-key"
        assert request.headers["X-API-Key"] == "test-api-key"
        payload = json.loads(request.content)
        assert payload == {
            "inputs": ["Hà Nội là thủ đô của Việt Nam."],
            "normalize": True,
            "truncate": True,
        }
        # TEI Native returns direct array of vectors
        return httpx.Response(
            200,
            json=[[0.1] * 1024],
        )

    settings = Settings(
        _env_file=None,
        embedding_enabled=True,
        embedding_provider="dutai",
        embedding_api_url="https://textembedding.dutai.io.vn/embed",
        embedding_api_key="test-api-key",
        embedding_model="BAAI/bge-m3",
        embedding_dimensions=1024,
    )
    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        service = DutAiEmbeddingService(client, settings)
        vectors = await service.embed(["Hà Nội là thủ đô của Việt Nam."])

    assert len(vectors) == 1
    assert len(vectors[0]) == 1024
    assert vectors[0] == [0.1] * 1024


@pytest.mark.asyncio
async def test_dutai_tei_openai_compatible_embed_endpoint() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.headers["Authorization"] == "Bearer test-api-key"
        payload = json.loads(request.content)
        assert payload == {
            "model": "BAAI/bge-m3",
            "input": ["Khoa học máy tính"],
        }
        return httpx.Response(
            200,
            json={
                "object": "list",
                "data": [{"object": "embedding", "embedding": [0.5] * 1024, "index": 0}],
                "model": "BAAI/bge-m3",
            },
        )

    settings = Settings(
        _env_file=None,
        embedding_enabled=True,
        embedding_provider="dutai",
        embedding_api_url="https://textembedding.dutai.io.vn/v1/embeddings",
        embedding_api_key="test-api-key",
        embedding_model="BAAI/bge-m3",
        embedding_dimensions=1024,
    )
    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        service = DutAiEmbeddingService(client, settings)
        vectors = await service.embed(["Khoa học máy tính"])

    assert len(vectors) == 1
    assert len(vectors[0]) == 1024


@pytest.mark.asyncio
async def test_dutai_rerank_service() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.headers["Authorization"] == "Bearer test-api-key"
        assert request.headers["X-API-Key"] == "test-api-key"
        payload = json.loads(request.content)
        assert payload["query"] == "Thủ đô của Việt Nam là gì?"
        assert payload["texts"] == [
            "Đà Nẵng có bãi biển đẹp.",
            "Hà Nội là thủ đô của Việt Nam.",
        ]
        return httpx.Response(
            200,
            json=[
                {"index": 1, "score": 0.9982, "text": "Hà Nội là thủ đô của Việt Nam."},
                {"index": 0, "score": 0.0004, "text": "Đà Nẵng có bãi biển đẹp."},
            ],
        )

    settings = Settings(
        _env_file=None,
        rerank_enabled=True,
        rerank_provider="dutai",
        rerank_api_url="https://textembedding.dutai.io.vn/rerank",
        rerank_api_key="test-api-key",
        rerank_model="BAAI/bge-reranker-v2-m3",
    )
    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        service = DutAiRerankService(client, settings)
        results = await service.rerank(
            query="Thủ đô của Việt Nam là gì?",
            texts=[
                "Đà Nẵng có bãi biển đẹp.",
                "Hà Nội là thủ đô của Việt Nam.",
            ],
            return_text=True,
        )

    assert len(results) == 2
    assert results[0].index == 1
    assert results[0].score == pytest.approx(0.9982)
    assert results[0].text == "Hà Nội là thủ đô của Việt Nam."
    assert results[1].index == 0


@pytest.mark.asyncio
async def test_local_rerank_service_scores_by_term_overlap() -> None:
    service = LocalRerankService()
    results = await service.rerank(
        query="mạng neural",
        texts=["mạng neural tích chập", "học máy nói chung", "mạng máy tính"],
    )
    assert len(results) == 3
    assert results[0].index == 0  # Highest overlap


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


class FakeRerankService:
    enabled = True
    model_name = "test-reranker"
    calls = 0

    async def rerank(
        self, query: str, texts: list[str], *, return_text: bool = False, top_k: int | None = None
    ):
        self.calls += 1
        # Reverse order for testing reordering
        items = [
            RerankItem(index=i, score=0.5 + 0.1 * i, text=texts[i] if return_text else None)
            for i in range(len(texts))
        ]
        items.sort(key=lambda x: x.score, reverse=True)
        return items[:top_k] if top_k else items


@pytest.mark.asyncio
async def test_related_lessons_uses_cached_question_embedding_and_reranker() -> None:
    question = make_question()
    embedding_service = FakeEmbeddingService()
    rerank_service = FakeRerankService()
    await QuestionEmbeddingService(embedding_service).prepare(question)
    assert embedding_service.calls == 1
    assert question.embedding_source_hash == question_embedding_hash(question)

    fresh_content = "# Batch normalization\nNội dung hiện tại"
    lesson_id_1 = uuid4()
    lesson_id_2 = uuid4()
    matches = [
        LessonChunkMatch(
            lesson_id=lesson_id_1,
            lesson_name="Lesson 1",
            lesson_description="Desc 1",
            lesson_slug="lesson-1",
            lesson_content_md=fresh_content,
            chunk_content="Đoạn 1",
            heading_path=("H1",),
            source_hash=lesson_source_hash("Lesson 1", "Desc 1", fresh_content),
            score=0.7,
        ),
        LessonChunkMatch(
            lesson_id=lesson_id_2,
            lesson_name="Lesson 2",
            lesson_description="Desc 2",
            lesson_slug="lesson-2",
            lesson_content_md=fresh_content,
            chunk_content="Đoạn 2",
            heading_path=("H2",),
            source_hash=lesson_source_hash("Lesson 2", "Desc 2", fresh_content),
            score=0.6,
        ),
    ]
    use_case = GetRelatedLessonsUseCase(
        FakeQuestionRepository(question),
        FakeChunkRepository(matches),
        embedding_service,
        rerank_service,
    )

    result = await use_case.execute(question.id, limit=3, min_score=0.25)

    assert result is not None
    assert rerank_service.calls == 1
    # Chunk at index 1 gets score 0.6 from fake reranker, index 0 gets 0.5 -> lesson 2 ranked first
    assert [item["id"] for item in result] == [lesson_id_2, lesson_id_1]
    assert embedding_service.calls == 1  # no embedding call on read endpoint


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


@pytest.mark.asyncio
async def test_relative_documents_groups_current_chunks_by_lesson() -> None:
    question = make_question()
    embedding_service = FakeEmbeddingService()
    await QuestionEmbeddingService(embedding_service).prepare(question)

    first_id, second_id = uuid4(), uuid4()
    first_md = "# First lesson\n\nRelevant paragraph.\n\nAnother paragraph."
    second_md = "# Second lesson\n\nRelated content."

    def match(lesson_id, title, full_md, chunk, score, stale=False):
        return LessonChunkMatch(
            lesson_id=lesson_id,
            lesson_name=title,
            lesson_description="",
            lesson_slug=None,
            lesson_content_md=full_md,
            chunk_content=chunk,
            heading_path=(title,),
            source_hash=("stale" if stale else lesson_source_hash(title, "", full_md)),
            score=score,
        )

    matches = [
        match(first_id, "First lesson", first_md, "Relevant paragraph.", 0.92),
        match(second_id, "Second lesson", second_md, "Related content.", 0.85),
        match(first_id, "First lesson", first_md, "Another paragraph.", 0.79),
        match(first_id, "First lesson", first_md, "Relevant paragraph.", 0.78),
        match(second_id, "Second lesson", second_md, "Outdated", 0.75, stale=True),
        match(second_id, "Second lesson", second_md, "Below threshold", 0.1),
    ]
    use_case = GetRelatedLessonsUseCase(
        FakeQuestionRepository(question),
        FakeChunkRepository(matches),
        embedding_service,
    )

    result = await use_case.get_relative_document(question.id, limit=2, min_score=0.25)

    assert result == [
        {
            "document_title": "First lesson",
            "full_md": first_md,
            "relative_chunk": ["Relevant paragraph.", "Another paragraph."],
        },
        {
            "document_title": "Second lesson",
            "full_md": second_md,
            "relative_chunk": ["Related content."],
        },
    ]
    assert embedding_service.calls == 1
