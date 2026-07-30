from typing import AsyncIterable

import httpx
from dishka import Provider, Scope, provide
from redis.asyncio import Redis

from app.domain.interfaces import (
    IDUTAIManageCache,
    IManageService,
    IS3Client,
    IHackathonSubmissionStore,
    ISubmissionQueue,
    IEmbeddingService,
    ILessonIndexQueue,
)
from app.domain.interfaces.pdf_import_queue import IPdfImportQueue
from app.config import settings
from app.infrastructure.clients import (
    DUTAIManageService,
    GoogleOAuthClient,
)
from app.infrastructure.clients.minio_client import MinioClient
from app.infrastructure.clients.hackathon_submission_store import (
    MinIOHackathonSubmissionStore,
)
from app.infrastructure.clients.arq_submission_queue import ArqSubmissionQueue
from app.infrastructure.clients.arq_lesson_index_queue import ArqLessonIndexQueue
from app.infrastructure.clients.arq_pdf_import_queue import ArqPdfImportQueue
from app.infrastructure.clients.embedding_service import (
    DutAiEmbeddingService,
    LocalHashingEmbeddingService,
    OpenAICompatibleEmbeddingService,
)


class ClientProvider(Provider):
    """Dependency Injection provider for external API clients."""

    @provide(scope=Scope.APP)
    async def get_http_client(self) -> AsyncIterable[httpx.AsyncClient]:
        """Provide http client."""
        async with httpx.AsyncClient() as client:
            yield client

    @provide(scope=Scope.APP)
    def get_google_oauth_client(self, client: httpx.AsyncClient) -> GoogleOAuthClient:
        """Provide google oauth client."""
        return GoogleOAuthClient(client)

    @provide(scope=Scope.APP)
    def get_dut_ai_manage_service(
        self, client: httpx.AsyncClient, cache: IDUTAIManageCache
    ) -> IManageService:
        """Provide DUT AI manage service client."""
        return DUTAIManageService(client, cache)

    @provide(scope=Scope.APP)
    def get_minio_client(self) -> IS3Client:
        """Provide concrete MinIO S3 client."""
        return MinioClient()

    @provide(scope=Scope.APP)
    def get_hackathon_submission_store(
        self, s3_client: IS3Client
    ) -> IHackathonSubmissionStore:
        """Provide MinIO Hackathon Submission Store."""
        return MinIOHackathonSubmissionStore(s3_client)

    @provide(scope=Scope.APP)
    def get_arq_submission_queue(self, redis: Redis) -> ISubmissionQueue:
        """Provide concrete Arq submission queue service."""
        return ArqSubmissionQueue(redis)

    @provide(scope=Scope.APP)
    def get_arq_lesson_index_queue(self, redis: Redis) -> ILessonIndexQueue:
        return ArqLessonIndexQueue(redis)

    @provide(scope=Scope.APP)
    def get_pdf_import_queue(self, redis: Redis) -> IPdfImportQueue:
        return ArqPdfImportQueue(redis)

    @provide(scope=Scope.APP)
    def get_embedding_service(
        self, client: httpx.AsyncClient
    ) -> IEmbeddingService:
        if settings.embedding_provider.casefold() == "local":
            return LocalHashingEmbeddingService(settings)
        if settings.embedding_provider.casefold() == "dutai":
            return DutAiEmbeddingService(client, settings)
        return OpenAICompatibleEmbeddingService(client, settings)
