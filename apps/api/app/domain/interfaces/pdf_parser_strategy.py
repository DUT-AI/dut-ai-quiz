import abc

from app.presentation.schemas.pdf_import import ParsedQuestionPreview


class IPdfParserStrategy(abc.ABC):
    """
    Abstract interface for parsing PDFs into structured quiz questions.
    Different implementations can use Rule-based parsing, AI multimodal,
    or local OCR (PaddleOCR/OpenDataLoader).
    """

    @abc.abstractmethod
    async def parse(
        self, pdf_bytes: bytes, password: str | None = None, **kwargs
    ) -> list[ParsedQuestionPreview]:
        """
        Parses a PDF file and returns a list of question previews.
        """
        pass
