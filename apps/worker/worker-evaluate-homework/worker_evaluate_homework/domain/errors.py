class InvalidArtifactError(ValueError):
    """The homework attachment or submission archive cannot be graded."""


class GradingError(RuntimeError):
    """An infrastructure failure translated into a provider-independent error."""

    def __init__(self, message: str, *, retryable: bool = False) -> None:
        super().__init__(message)
        self.retryable = retryable


class LLMError(GradingError):
    """The grading model could not produce a valid response."""


class ArtifactStorageError(GradingError):
    """The artifact could not be downloaded from storage."""


class ContextLimitError(LLMError):
    """The request cannot fit; sending the same request again cannot help."""


def is_retryable_error(error: Exception) -> bool:
    return isinstance(error, GradingError) and error.retryable
