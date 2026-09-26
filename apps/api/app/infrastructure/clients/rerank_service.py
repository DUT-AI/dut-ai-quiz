import re
import unicodedata

import httpx

from app.config import Settings
from app.domain.interfaces.rerank_service import (
    IRerankService,
    RerankItem,
    RerankServiceError,
)


class DutAiRerankService(IRerankService):
    """Adapter for Hugging Face TEI Reranking service (e.g. https://textembedding.dutai.io.vn/rerank).

    Uses cross-encoder models such as BAAI/bge-reranker-v2-m3 to score (query, text) pairs.
    """

    def __init__(self, client: httpx.AsyncClient, settings: Settings) -> None:
        self._client = client
        self._settings = settings

    @property
    def enabled(self) -> bool:
        return self._settings.rerank_enabled

    @property
    def model_name(self) -> str:
        return self._settings.rerank_model

    async def rerank(
        self,
        query: str,
        texts: list[str],
        *,
        return_text: bool = False,
        top_k: int | None = None,
    ) -> list[RerankItem]:
        if not self.enabled:
            raise RerankServiceError("Reranking service is not enabled")
        if not texts:
            return []
        if not query.strip():
            return [
                RerankItem(index=i, score=0.0, text=t if return_text else None)
                for i, t in enumerate(texts)
            ][:top_k]

        batch_size = max(1, self._settings.rerank_batch_size)
        headers: dict[str, str] = {"Content-Type": "application/json"}
        if self._settings.rerank_api_key:
            headers["Authorization"] = f"Bearer {self._settings.rerank_api_key}"
            headers["X-API-Key"] = self._settings.rerank_api_key

        all_results: list[RerankItem] = []

        try:
            for offset in range(0, len(texts), batch_size):
                batch = texts[offset : offset + batch_size]
                payload = {
                    "query": query,
                    "texts": batch,
                    "return_text": return_text,
                    "truncate": True,
                }
                response = await self._client.post(
                    self._settings.rerank_api_url,
                    headers=headers,
                    json=payload,
                    timeout=self._settings.rerank_timeout_seconds,
                )
                response.raise_for_status()
                data = response.json()

                if not isinstance(data, list):
                    raise ValueError(f"Unexpected response format from rerank service: {data}")

                for item in data:
                    local_index = int(item["index"])
                    global_index = offset + local_index
                    score = float(item["score"])
                    text_val = item.get("text") if return_text else None
                    all_results.append(RerankItem(index=global_index, score=score, text=text_val))
        except (httpx.HTTPError, KeyError, TypeError, ValueError) as exc:
            err_msg = str(exc) or repr(exc)
            raise RerankServiceError(f"DUT-AI reranking service failed ({type(exc).__name__}): {err_msg}") from exc

        # Sort all items by score descending
        all_results.sort(key=lambda item: item.score, reverse=True)
        if top_k is not None:
            return all_results[:top_k]
        return all_results


class DisabledRerankService(IRerankService):
    """Fallback when reranking is turned off."""

    @property
    def enabled(self) -> bool:
        return False

    @property
    def model_name(self) -> str:
        return "disabled"

    async def rerank(
        self,
        query: str,
        texts: list[str],
        *,
        return_text: bool = False,
        top_k: int | None = None,
    ) -> list[RerankItem]:
        items = [
            RerankItem(index=i, score=1.0, text=t if return_text else None)
            for i, t in enumerate(texts)
        ]
        if top_k is not None:
            return items[:top_k]
        return items


class LocalRerankService(IRerankService):
    """Simple term-overlap reranker for offline / testing environments."""

    _word_pattern = re.compile(r"[^\W_]+", re.UNICODE)

    @property
    def enabled(self) -> bool:
        return True

    @property
    def model_name(self) -> str:
        return "local-term-overlap-v1"

    async def rerank(
        self,
        query: str,
        texts: list[str],
        *,
        return_text: bool = False,
        top_k: int | None = None,
    ) -> list[RerankItem]:
        if not texts:
            return []
        q_norm = unicodedata.normalize("NFKC", query).casefold()
        q_words = set(self._word_pattern.findall(q_norm))
        if not q_words:
            items = [
                RerankItem(index=i, score=0.0, text=t if return_text else None)
                for i, t in enumerate(texts)
            ]
            return items[:top_k] if top_k is not None else items

        results: list[RerankItem] = []
        for i, text in enumerate(texts):
            t_norm = unicodedata.normalize("NFKC", text).casefold()
            t_words = set(self._word_pattern.findall(t_norm))
            intersection = q_words & t_words
            union = q_words | t_words
            score = len(intersection) / len(union) if union else 0.0
            results.append(RerankItem(index=i, score=score, text=text if return_text else None))

        results.sort(key=lambda x: x.score, reverse=True)
        if top_k is not None:
            return results[:top_k]
        return results
