from typing import AsyncIterable
import httpx
from dishka import Provider, Scope, provide

from app.infrastructure.clients import GoogleOAuthClient, ManageServiceClient
from app.infrastructure.clients.blog_service import BlogServiceClient


class ClientProvider(Provider):
    @provide(scope=Scope.APP)
    async def get_http_client(self) -> AsyncIterable[httpx.AsyncClient]:
        async with httpx.AsyncClient() as client:
            yield client

    @provide(scope=Scope.APP)
    def get_google_oauth_client(self, client: httpx.AsyncClient) -> GoogleOAuthClient:
        return GoogleOAuthClient(client)

    @provide(scope=Scope.APP)
    def get_manage_service_client(self, client: httpx.AsyncClient) -> ManageServiceClient:
        return ManageServiceClient(client)

    @provide(scope=Scope.APP)
    def get_blog_service_client(self, client: httpx.AsyncClient) -> BlogServiceClient:
        return BlogServiceClient(client)
