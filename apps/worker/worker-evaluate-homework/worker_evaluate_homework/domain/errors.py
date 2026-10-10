import httpx


class InvalidArtifactError(ValueError):
    """The homework attachment or submission archive cannot be graded."""


class LLMError(RuntimeError):
    """An LLM failure with an explicit retry policy."""

    def __init__(self, message: str, *, retryable: bool = False) -> None:
        super().__init__(message)
        self.retryable = retryable


class ContextLimitError(LLMError):
    """The request cannot fit; sending the same request again cannot help."""


def is_retryable_error(error: Exception) -> bool:
    if isinstance(error, LLMError):
        return error.retryable
    if isinstance(error, httpx.HTTPStatusError):
        return error.response.status_code in {408, 429} or error.response.status_code >= 500
    return isinstance(error, httpx.TransportError)
