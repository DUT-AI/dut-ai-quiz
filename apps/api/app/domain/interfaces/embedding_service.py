from typing import Protocol


class EmbeddingServiceError(RuntimeError):
    """Raised when the configured embedding provider cannot serve a request."""


class IEmbeddingService(Protocol):
    @property
    def enabled(self) -> bool: ...

    @property
    def model_name(self) -> str: ...

    async def embed(self, texts: list[str]) -> list[list[float]]: ...
