import hashlib

from app.domain.entities.question import QuestionEntity
from app.domain.interfaces import EmbeddingServiceError, IEmbeddingService
from loguru import logger


def question_embedding_text(question: QuestionEntity) -> str:
    options = "\n".join(f"- {option.text}" for option in question.options)
    return f"Question: {question.content}\nOptions:\n{options}".strip()


def question_embedding_hash(question: QuestionEntity) -> str:
    return hashlib.sha256(question_embedding_text(question).encode("utf-8")).hexdigest()


def question_query_embedding_text(content: str) -> str:
    """Use the same retrieval prefix as persisted question embeddings."""
    return f"Question: {content.strip()}"


class QuestionEmbeddingService:
    """Populate a question's cached retrieval vector before it is persisted."""

    def __init__(self, embedding_service: IEmbeddingService) -> None:
        self._embedding_service = embedding_service

    async def prepare(self, question: QuestionEntity) -> None:
        source_hash = question_embedding_hash(question)
        question.embedding_source_hash = source_hash
        if not self._embedding_service.enabled:
            question.embedding = None
            question.embedding_model = None
            return
        try:
            question.embedding = (
                await self._embedding_service.embed([question_embedding_text(question)])
            )[0]
            question.embedding_model = self._embedding_service.model_name
        except EmbeddingServiceError as exc:
            # Question CRUD remains available during an external provider outage;
            # related lessons return 503 until the question is saved successfully.
            question.embedding = None
            question.embedding_model = None
            logger.warning("Could not embed question {}: {}", question.id, exc)

    async def prepare_many(self, questions: list[QuestionEntity]) -> None:
        if not questions:
            return
        hashes = [question_embedding_hash(question) for question in questions]
        for question, source_hash in zip(questions, hashes, strict=True):
            question.embedding_source_hash = source_hash
        if not self._embedding_service.enabled:
            return
        try:
            vectors = await self._embedding_service.embed(
                [question_embedding_text(question) for question in questions]
            )
        except EmbeddingServiceError as exc:
            logger.warning("Could not embed question batch: {}", exc)
            return
        for question, vector in zip(questions, vectors, strict=True):
            question.embedding = vector
            question.embedding_model = self._embedding_service.model_name
