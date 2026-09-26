from dataclasses import dataclass
from typing import Protocol


class RerankServiceError(RuntimeError):
    """Raised when the configured reranking provider cannot serve a request."""


@dataclass(frozen=True)
class RerankItem:
    index: int
    score: float
    text: str | None = None


class IRerankService(Protocol):
    @property
    def enabled(self) -> bool: ...

    @property
    def model_name(self) -> str: ...

    async def rerank(
        self,
        query: str,
        texts: list[str],
        *,
        return_text: bool = False,
        top_k: int | None = None,
    ) -> list[RerankItem]: ...
