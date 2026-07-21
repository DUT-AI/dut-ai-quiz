import re


class LessonChunker:
    """Split Markdown into overlapping chunks without cutting most paragraphs."""

    def __init__(self, max_chars: int, overlap_chars: int) -> None:
        self._max_chars = max(200, max_chars)
        self._overlap_chars = max(0, min(overlap_chars, self._max_chars // 2))

    def split(self, content: str) -> list[str]:
        normalized = content.replace("\r\n", "\n").strip()
        if not normalized:
            return []

        paragraphs = [part.strip() for part in re.split(r"\n{2,}", normalized) if part.strip()]
        units: list[str] = []
        for paragraph in paragraphs:
            units.extend(self._split_oversized(paragraph))

        chunks: list[str] = []
        current = ""
        for unit in units:
            candidate = f"{current}\n\n{unit}".strip() if current else unit
            if current and len(candidate) > self._max_chars:
                chunks.append(current)
                overlap = self._tail(current)
                current = f"{overlap}\n\n{unit}".strip() if overlap else unit
            else:
                current = candidate
        if current:
            chunks.append(current)
        return chunks

    def _split_oversized(self, text: str) -> list[str]:
        if len(text) <= self._max_chars:
            return [text]
        words = text.split()
        parts: list[str] = []
        current: list[str] = []
        length = 0
        for word in words:
            extra = len(word) + (1 if current else 0)
            if current and length + extra > self._max_chars:
                parts.append(" ".join(current))
                current = []
                length = 0
            current.append(word)
            length += len(word) + (1 if len(current) > 1 else 0)
        if current:
            parts.append(" ".join(current))
        return parts

    def _tail(self, text: str) -> str:
        if self._overlap_chars == 0:
            return ""
        tail = text[-self._overlap_chars :]
        first_space = tail.find(" ")
        return tail[first_space + 1 :].strip() if first_space >= 0 else tail.strip()
