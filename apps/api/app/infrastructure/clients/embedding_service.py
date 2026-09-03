import hashlib
import math
import re
import unicodedata

import httpx

from app.config import Settings
from app.domain.interfaces import EmbeddingServiceError, IEmbeddingService


class LocalHashingEmbeddingService(IEmbeddingService):
    """Zero-config deterministic text embedding for local/dev deployments.

    Word, bigram and character n-gram features are projected into a fixed-size
    vector. A remote neural embedding provider can replace this adapter without
    changing repositories or use cases.
    """

    _word_pattern = re.compile(r"[^\W_]+", re.UNICODE)

    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    @property
    def enabled(self) -> bool:
        return self._settings.embedding_enabled

    @property
    def model_name(self) -> str:
        return f"local-hashing-v1-{self._settings.embedding_dimensions}"

    async def embed(self, texts: list[str]) -> list[list[float]]:
        if not self.enabled:
            raise EmbeddingServiceError("Lesson embedding is not enabled")
        return [self._embed_one(text) for text in texts]

    def _embed_one(self, text: str) -> list[float]:
        dimensions = self._settings.embedding_dimensions
        vector = [0.0] * dimensions
        normalized = unicodedata.normalize("NFKC", text).casefold()
        words = self._word_pattern.findall(normalized)

        features: list[tuple[str, float]] = [
            (f"word:{word}", 1.0) for word in words
        ]
        features.extend(
            (f"bigram:{left}:{right}", 1.35)
            for left, right in zip(words, words[1:])
        )

        compact = " ".join(words)
        for size in (3, 4, 5):
            features.extend(
                (f"char{size}:{compact[index:index + size]}", 0.2)
                for index in range(max(0, len(compact) - size + 1))
            )

        for feature, weight in features:
            digest = hashlib.blake2b(
                feature.encode("utf-8"), digest_size=8, person=b"dutaiquiz"
            ).digest()
            hashed = int.from_bytes(digest, "big")
            index = hashed % dimensions
            sign = 1.0 if (hashed >> 63) == 0 else -1.0
            vector[index] += sign * weight

        norm = math.sqrt(sum(value * value for value in vector))
        if norm:
            vector = [value / norm for value in vector]
        return vector


class DutAiEmbeddingService(IEmbeddingService):
    """Adapter for https://embedding.dutai.site/v1/embeddings."""

    def __init__(self, client: httpx.AsyncClient, settings: Settings) -> None:
        self._client = client
        self._settings = settings

    @property
    def enabled(self) -> bool:
        return self._settings.embedding_enabled

    @property
    def model_name(self) -> str:
        return self._settings.embedding_model

    async def embed(self, texts: list[str]) -> list[list[float]]:
        if not self.enabled:
            raise EmbeddingServiceError("Lesson embedding is not enabled")
        if not texts:
            return []

        result: list[list[float]] = []
        batch_size = max(1, self._settings.embedding_batch_size)
        headers = {"Content-Type": "application/json"}
        if self._settings.embedding_api_key:
            headers["Authorization"] = f"Bearer {self._settings.embedding_api_key}"

        try:
            for offset in range(0, len(texts), batch_size):
                batch = texts[offset : offset + batch_size]
                response = await self._client.post(
                    self._settings.embedding_api_url,
                    headers=headers,
                    json={"input": batch, "model_id": self.model_name},
                    timeout=self._settings.embedding_timeout_seconds,
                )
                response.raise_for_status()
                payload = response.json()
                if payload["model"] != self.model_name:
                    raise ValueError(
                        "Embedding service returned a different model: "
                        f"{payload['model']}"
                    )
                data = sorted(payload["data"], key=lambda item: item["index"])
                result.extend(item["embedding"] for item in data)
        except (httpx.HTTPError, KeyError, TypeError, ValueError) as exc:
            raise EmbeddingServiceError(
                f"DUT-AI embedding service failed: {exc}"
            ) from exc

        expected = self._settings.embedding_dimensions
        if len(result) != len(texts) or any(
            len(vector) != expected for vector in result
        ):
            raise EmbeddingServiceError(
                "DUT-AI embedding service returned an unexpected vector shape; "
                f"expected {expected} dimensions"
            )
        return result


class OpenAICompatibleEmbeddingService(IEmbeddingService):
    """Embedding adapter for any provider implementing the OpenAI contract."""

    def __init__(self, client: httpx.AsyncClient, settings: Settings) -> None:
        self._client = client
        self._settings = settings

    @property
    def enabled(self) -> bool:
        return self._settings.embedding_enabled

    @property
    def model_name(self) -> str:
        return self._settings.embedding_model

    async def embed(self, texts: list[str]) -> list[list[float]]:
        if not self.enabled:
            raise EmbeddingServiceError("Lesson embedding is not enabled")
        if not texts:
            return []

        result: list[list[float]] = []
        batch_size = max(1, self._settings.embedding_batch_size)
        headers = {"Content-Type": "application/json"}
        if self._settings.embedding_api_key:
            headers["Authorization"] = f"Bearer {self._settings.embedding_api_key}"

        try:
            for offset in range(0, len(texts), batch_size):
                batch = texts[offset : offset + batch_size]
                response = await self._client.post(
                    self._settings.embedding_api_url,
                    headers=headers,
                    json={
                        "model": self.model_name,
                        "input": batch,
                        "dimensions": self._settings.embedding_dimensions,
                    },
                    timeout=self._settings.embedding_timeout_seconds,
                )
                response.raise_for_status()
                data = sorted(response.json()["data"], key=lambda item: item["index"])
                result.extend(item["embedding"] for item in data)
        except (httpx.HTTPError, KeyError, TypeError, ValueError) as exc:
            raise EmbeddingServiceError(f"Embedding provider failed: {exc}") from exc

        expected = self._settings.embedding_dimensions
        if len(result) != len(texts) or any(len(vector) != expected for vector in result):
            raise EmbeddingServiceError(
                f"Embedding provider returned an unexpected vector shape; expected {expected} dimensions"
            )
        return result
