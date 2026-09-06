import json
from typing import Any, TypeVar

import httpx
from app.config import settings
from loguru import logger
from pydantic import BaseModel

from worker_evaluate_homework.domain.interfaces import ILLMClient

T = TypeVar("T", bound=BaseModel)


def _strip_code_fence(value: str) -> str:
    stripped = value.strip()
    if stripped.startswith("```"):
        stripped = stripped.split("\n", 1)[-1]
    stripped = stripped.removesuffix("```")
    return stripped.strip()


def _extract_json(value: str) -> str:
    """Extract clean JSON substring from LLM output (handles code fences, text prefix/suffix)."""
    stripped = _strip_code_fence(value).strip()
    start = stripped.find("{")
    end = stripped.rfind("}")
    if start != -1 and end != -1 and end > start:
        return stripped[start : end + 1]
    return stripped


class OpenAILLMClient(ILLMClient):
    """Client for any OpenAI-compatible chat completions endpoint (vLLM, llama.cpp, LiteLLM, etc.)."""

    def __init__(
        self,
        api_url: str | None = None,
        api_key: str | None = None,
        model: str | None = None,
        temperature: float | None = None,
        timeout: float | None = None,
        http_client: httpx.AsyncClient | None = None,
    ) -> None:
        raw_url = (api_url or settings.homework_llm_api_url).rstrip("/")
        if not raw_url.endswith("/chat/completions"):
            self._chat_url = f"{raw_url}/chat/completions"
        else:
            self._chat_url = raw_url

        self._api_key = api_key if api_key is not None else settings.homework_llm_api_key
        self._model = model or settings.homework_llm_model
        self._temperature = (
            temperature if temperature is not None else settings.homework_llm_temperature
        )
        self._timeout = (
            timeout if timeout is not None else settings.homework_llm_timeout_seconds
        )
        self._client = http_client

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=self._timeout)
        return self._client

    async def generate_structured(
        self,
        prompt: str,
        schema: type[T],
        system_instruction: str = "",
    ) -> T:
        client = await self._get_client()
        headers = {"Content-Type": "application/json"}
        if self._api_key:
            headers["Authorization"] = f"Bearer {self._api_key}"

        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self._model,
            "messages": messages,
            "temperature": self._temperature,
            "response_format": {"type": "json_object"},
        }

        try:
            response = await client.post(
                self._chat_url,
                headers=headers,
                json=payload,
                timeout=self._timeout,
            )
            response.raise_for_status()
            data = response.json()
            content = data["choices"][0]["message"]["content"]
        except Exception as exc:
            logger.error(f"OpenAI LLM request to {self._chat_url} failed: {exc}")
            raise RuntimeError(f"Lỗi khi gọi LLM: {exc}") from exc

        if not content:
            raise RuntimeError("LLM không trả về nội dung kết quả")

        extracted_json = _extract_json(content)
        try:
            return schema.model_validate_json(extracted_json)
        except Exception as exc:
            logger.error(
                f"Failed to validate JSON against schema {schema.__name__}: {exc}\nRaw content:\n{content}"
            )
            raise RuntimeError(f"LLM trả về định dạng JSON không hợp lệ: {exc}") from exc


class GeminiLLMClient(ILLMClient):
    """Client for Google GenAI / Gemini API."""

    def __init__(
        self,
        api_key: str | None = None,
        model: str = "gemma-4-31b-it",
    ) -> None:
        key = api_key or settings.gemini_api_key
        if not key:
            raise RuntimeError("Thiếu GEMINI_API_KEY; chưa thể khởi tạo GeminiLLMClient")
        from google import genai

        self._client = genai.Client(api_key=key)
        self._model = model

    async def generate_structured(
        self,
        prompt: str,
        schema: type[T],
        system_instruction: str = "",
    ) -> T:
        from google.genai import types as genai_types

        from .llm_clients import _clean_schema

        schema_dict = _clean_schema(schema.model_json_schema())
        response = await self._client.aio.models.generate_content(
            model=self._model,
            contents=prompt,
            config=genai_types.GenerateContentConfig(
                system_instruction=system_instruction or None,
                response_mime_type="application/json",
                response_schema=schema_dict,
                temperature=0.1,
                max_output_tokens=8192,
            ),
        )
        if not response.text:
            raise RuntimeError("Gemini không trả về nội dung")
        return schema.model_validate_json(_strip_code_fence(response.text))


def _clean_schema(value: Any) -> Any:
    if isinstance(value, dict):
        return {
            key: _clean_schema(item)
            for key, item in value.items()
            if key
            not in {
                "additionalProperties",
                "exclusiveMaximum",
                "exclusiveMinimum",
            }
        }
    if isinstance(value, list):
        return [_clean_schema(item) for item in value]
    return value
