import hashlib
from collections import OrderedDict
from typing import Any, TypeVar

import httpx
from app.config import settings
from loguru import logger
from pydantic import BaseModel

from worker_evaluate_homework.domain.errors import ContextLimitError, LLMError
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
        self._timeout = timeout if timeout is not None else settings.homework_llm_timeout_seconds
        self._client = http_client
        root = self._chat_url.removesuffix("/chat/completions").removesuffix("/v1")
        self._tokenizer_url = (settings.homework_llm_tokenizer_url or root).rstrip("/")
        self._context_tokens = settings.homework_llm_context_tokens
        self._context_checked = False
        self._token_counts: OrderedDict[str, int] = OrderedDict()

    @property
    def input_token_budget(self) -> int:
        return (
            self._context_tokens
            - settings.homework_llm_max_output_tokens
            - settings.homework_llm_token_margin
        )

    def _headers(self) -> dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self._api_key:
            headers["Authorization"] = f"Bearer {self._api_key}"
        return headers

    @staticmethod
    def _messages(prompt: str, system_instruction: str) -> list[dict[str, str]]:
        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})
        return messages

    async def count_tokens(self, prompt: str, system_instruction: str = "") -> int:
        """Use the inference server's tokenizer and chat template, never chars/4."""
        if (
            len((system_instruction + prompt).encode("utf-8"))
            > settings.homework_llm_max_tokenizer_bytes
        ):
            raise ContextLimitError(
                "LLM tokenizer payload quá lớn; cần chia nội dung trước khi đếm token"
            )
        client = await self._get_client()
        if not self._context_checked:
            props = await self._request_json(client, "GET", "/props")
            context = props.get("default_generation_settings", {}).get("n_ctx")
            if isinstance(context, int) and context > 0:
                self._context_tokens = min(self._context_tokens, context)
            self._context_checked = True
        key = hashlib.sha256((system_instruction + "\0" + prompt).encode()).hexdigest()
        if key in self._token_counts:
            self._token_counts.move_to_end(key)
            return self._token_counts[key]
        template = await self._request_json(
            client,
            "POST",
            "/apply-template",
            {
                "model": self._model,
                "messages": self._messages(prompt, system_instruction),
                "chat_template_kwargs": {"enable_thinking": False},
                "reasoning_effort": "none",
            },
        )
        rendered = template.get("prompt")
        if not isinstance(rendered, str):
            raise LLMError("LLM tokenizer không trả về chat template hợp lệ")
        data = await self._request_json(
            client,
            "POST",
            "/tokenize",
            {"model": self._model, "content": rendered, "add_special": True, "parse_special": True},
        )
        tokens = data.get("tokens")
        if not isinstance(tokens, list):
            raise LLMError("LLM tokenizer không trả về danh sách token hợp lệ")
        count = len(tokens)
        self._token_counts[key] = count
        if len(self._token_counts) > 128:
            self._token_counts.popitem(last=False)
        return count

    async def _request_json(self, client, method, path, payload=None) -> dict:
        try:
            response = await client.request(
                method,
                self._tokenizer_url + path,
                headers=self._headers(),
                json=payload,
                timeout=self._timeout,
            )
            response.raise_for_status()
            data = response.json()
            if not isinstance(data, dict):
                raise ValueError("Expected JSON object")
            return data
        except httpx.HTTPStatusError as exc:
            retryable = exc.response.status_code in {408, 429} or exc.response.status_code >= 500
            raise LLMError(
                f"Lỗi LLM tokenizer ({exc.response.status_code}) tại {path}; "
                "kiểm tra HOMEWORK_LLM_TOKENIZER_URL và native endpoints",
                retryable=retryable,
            ) from exc
        except httpx.TransportError as exc:
            raise LLMError(
                f"Lỗi kết nối LLM tokenizer: {type(exc).__name__}", retryable=True
            ) from exc
        except ValueError as exc:
            raise LLMError(f"LLM tokenizer trả về dữ liệu không hợp lệ tại {path}") from exc

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
        token_count = await self.count_tokens(prompt, system_instruction)
        if token_count > self.input_token_budget:
            raise ContextLimitError(
                f"LLM prompt có {token_count} token, vượt ngân sách {self.input_token_budget} "
                f"(context={self._context_tokens}, output={settings.homework_llm_max_output_tokens})"
            )
        messages = self._messages(prompt, system_instruction)

        payload = {
            "model": self._model,
            "messages": messages,
            "temperature": self._temperature,
            # The native server enforces field types and evidence length limits.
            # A plain JSON object can still copy a large fragment into its answer.
            "response_format": {"type": "json_object", "schema": schema.model_json_schema()},
            "chat_template_kwargs": {"enable_thinking": False},
            "reasoning_effort": "none",
            "max_tokens": settings.homework_llm_max_output_tokens,
        }

        try:
            response = await client.post(
                self._chat_url,
                headers=self._headers(),
                json=payload,
                timeout=self._timeout,
            )
            response.raise_for_status()
            data = response.json()
            choice = data["choices"][0]
            content = choice["message"]["content"]
        except httpx.HTTPStatusError as exc:
            error_body = exc.response.text
            logger.error(
                f"OpenAI LLM request to {self._chat_url} failed with {exc.response.status_code}: {error_body}"
            )
            try:
                error = exc.response.json().get("error", {})
            except ValueError:
                error = {}
            if isinstance(error, dict) and error.get("type") == "exceed_context_size_error":
                context = error.get("n_ctx")
                if isinstance(context, int) and context > 0:
                    self._context_tokens = min(self._context_tokens, context)
                self._token_counts.clear()
                raise ContextLimitError(f"Lỗi khi gọi LLM (400): {error_body}") from exc
            raise LLMError(
                f"Lỗi khi gọi LLM ({exc.response.status_code}): {error_body[:2000]}",
                retryable=exc.response.status_code in {408, 429} or exc.response.status_code >= 500,
            ) from exc
        except httpx.TransportError as exc:
            raise LLMError(f"Lỗi kết nối LLM: {type(exc).__name__}", retryable=True) from exc
        except Exception as exc:
            logger.error(f"OpenAI LLM request to {self._chat_url} failed: {exc}")
            raise LLMError(f"LLM trả về response không hợp lệ: {exc}", retryable=True) from exc

        logger.info(
            "LLM response model={} prompt_tokens={} usage={} finish_reason={}",
            self._model,
            token_count,
            data.get("usage"),
            choice.get("finish_reason"),
        )
        if choice.get("finish_reason") == "length":
            raise LLMError("LLM JSON bị cắt do hết output token", retryable=True)

        if not content:
            raise LLMError("LLM không trả về nội dung kết quả", retryable=True)

        extracted_json = _extract_json(content)
        try:
            return schema.model_validate_json(extracted_json)
        except Exception as exc:
            logger.error(f"Failed to validate JSON against schema {schema.__name__}: {exc}")
            raise LLMError(
                f"LLM trả về định dạng JSON không hợp lệ: {exc}", retryable=True
            ) from exc


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

    @property
    def input_token_budget(self) -> int:
        return (
            settings.homework_llm_context_tokens
            - settings.homework_llm_max_output_tokens
            - settings.homework_llm_token_margin
        )

    async def count_tokens(self, prompt: str, system_instruction: str = "") -> int:
        response = await self._client.aio.models.count_tokens(
            model=self._model,
            contents=[system_instruction, prompt] if system_instruction else prompt,
        )
        return response.total_tokens or 0

    async def generate_structured(
        self,
        prompt: str,
        schema: type[T],
        system_instruction: str = "",
    ) -> T:
        from google.genai import types as genai_types

        from .llm_clients import _clean_schema

        schema_dict = _clean_schema(schema.model_json_schema())
        token_count = await self.count_tokens(prompt, system_instruction)
        if token_count > self.input_token_budget:
            raise ContextLimitError(
                f"LLM prompt có {token_count} token, vượt ngân sách {self.input_token_budget}"
            )
        response = await self._client.aio.models.generate_content(
            model=self._model,
            contents=prompt,
            config=genai_types.GenerateContentConfig(
                system_instruction=system_instruction or None,
                response_mime_type="application/json",
                response_schema=schema_dict,
                temperature=0.1,
                max_output_tokens=settings.homework_llm_max_output_tokens,
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
