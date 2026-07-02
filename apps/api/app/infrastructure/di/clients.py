from typing import AsyncIterable
import httpx
from dishka import Provider, Scope, provide

from app.domain.interfaces import IBlogCache
from app.infrastructure.clients import GoogleOAuthClient, ManageServiceClient
from app.infrastructure.clients.blog_service import BlogServiceClient


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
    def get_manage_service_client(
        self, client: httpx.AsyncClient
    ) -> ManageServiceClient:
        """Provide manage service client."""
        return ManageServiceClient(client)

    @provide(scope=Scope.APP)
    def get_blog_service_client(
        self, client: httpx.AsyncClient, blog_cache: IBlogCache
    ) -> BlogServiceClient:
        """Provide blog service client with cache interface."""
        return BlogServiceClient(client, blog_cache)
