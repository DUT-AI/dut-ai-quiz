import math
import re
from dataclasses import dataclass, field

from markdown_it import MarkdownIt

from app.domain.value_objects import LessonChunkDraft


@dataclass(slots=True)
class _Section:
    heading_path: tuple[str, ...]
    blocks: list[str] = field(default_factory=list)


class LessonChunker:
    """Split Markdown hierarchically while preserving complete structural blocks."""

    _ROOT_BLOCK_TYPES = {
        "paragraph_open",
        "blockquote_open",
        "bullet_list_open",
        "ordered_list_open",
        "table_open",
        "fence",
        "code_block",
        "html_block",
        "hr",
    }
    _BLOCK_FORMULA = re.compile(r"\$\$(.+?)\$\$|\\\[(.+?)\\\]", re.DOTALL)
    _INLINE_FORMULA = re.compile(r"(?<!\$)\$([^\n$]+?)\$(?!\$)")
    _IMAGE = re.compile(r"!\[([^\]]*)\]\(([^\s)]+)(?:\s+[\"'][^\"']*[\"'])?\)")
    _TABLE_SEPARATOR = re.compile(r"^:?-{3,}:?$")

    def __init__(self, target_tokens: int = 450, max_tokens: int = 600) -> None:
        self._target_tokens = max(100, target_tokens)
        self._max_tokens = max(self._target_tokens, max_tokens)
        self._markdown = MarkdownIt("commonmark", {"html": True}).enable("table")

    def split(self, content: str) -> list[LessonChunkDraft]:
        normalized = content.replace("\r\n", "\n").strip()
        if not normalized:
            return []

        chunks: list[LessonChunkDraft] = []
        for section in self._parse_sections(normalized):
            chunks.extend(self._chunk_section(section))
        return chunks

    def _parse_sections(self, content: str) -> list[_Section]:
        lines = content.splitlines()
        tokens = self._markdown.parse(content)
        headings: list[str] = []
        sections: list[_Section] = []
        current = _Section(heading_path=())

        for index, token in enumerate(tokens):
            if token.type == "heading_open" and token.level == 0:
                if current.blocks:
                    sections.append(current)
                level = int(token.tag[1])
                title = tokens[index + 1].content.strip()
                headings = headings[: level - 1]
                headings.append(title)
                current = _Section(heading_path=tuple(headings))
                continue

            if (
                token.level == 0
                and token.type in self._ROOT_BLOCK_TYPES
                and token.map is not None
            ):
                start, end = token.map
                raw = "\n".join(lines[start:end]).strip()
                if raw:
                    current.blocks.append(raw)

        if current.blocks:
            sections.append(current)
        return sections

    def _chunk_section(self, section: _Section) -> list[LessonChunkDraft]:
        chunks: list[LessonChunkDraft] = []
        current: list[str] = []
        context_tokens = self._breadcrumb_tokens(section.heading_path)
        current_tokens = context_tokens

        for block in section.blocks:
            for unit in self._split_oversized_plain_paragraph(block):
                # Formula/table/image enrichment is part of the provider input,
                # so it must count toward the model's sequence limit too.
                unit_tokens = self.estimate_tokens(self._enrich_block(unit))
                would_exceed = bool(current) and current_tokens + unit_tokens > self._max_tokens
                reached_target = bool(current) and current_tokens >= self._target_tokens
                if would_exceed or reached_target:
                    chunks.append(self._build_chunk(section, current))
                    current = []
                    current_tokens = context_tokens
                current.append(unit)
                current_tokens += unit_tokens

        if current:
            chunks.append(self._build_chunk(section, current))
        return chunks

    def _breadcrumb_tokens(self, heading_path: tuple[str, ...]) -> int:
        lines = [
            f"[H{level}] {heading}"
            for level, heading in enumerate(heading_path, start=1)
        ]
        if heading_path:
            lines.append(f"[SECTION] {' > '.join(heading_path)}")
        return self.estimate_tokens("\n".join(lines)) if lines else 0

    def _build_chunk(self, section: _Section, blocks: list[str]) -> LessonChunkDraft:
        content = "\n\n".join(blocks).strip()
        breadcrumb = " > ".join(section.heading_path)
        context_parts = [
            f"[H{level}] {heading}"
            for level, heading in enumerate(section.heading_path, start=1)
        ]
        if breadcrumb:
            context_parts.append(f"[SECTION] {breadcrumb}")
        context_parts.append("\n\n".join(self._enrich_block(block) for block in blocks))
        contextual_content = "\n".join(context_parts).strip()

        metadata = {
            "heading_path": list(section.heading_path),
            "h1": section.heading_path[0] if section.heading_path else None,
            "h2": section.heading_path[1] if len(section.heading_path) > 1 else None,
            "h3": section.heading_path[2] if len(section.heading_path) > 2 else None,
        }
        return LessonChunkDraft(
            content=content,
            contextual_content=contextual_content,
            heading_path=section.heading_path,
            token_count=self.estimate_tokens(contextual_content),
            metadata=metadata,
        )

    def _split_oversized_plain_paragraph(self, block: str) -> list[str]:
        if self.estimate_tokens(block) <= self._max_tokens:
            return [block]
        if (
            self._BLOCK_FORMULA.search(block)
            or self._looks_like_table(block)
            or block.lstrip().startswith(("```", "~~~", "<", "- ", "* ", "1. "))
        ):
            return [block]

        sentences = [
            part.strip()
            for part in re.split(r"(?<=[.!?。！？])\s+", block)
            if part.strip()
        ]
        if len(sentences) <= 1:
            return [block]

        result: list[str] = []
        current: list[str] = []
        for sentence in sentences:
            candidate = " ".join([*current, sentence])
            if current and self.estimate_tokens(candidate) > self._max_tokens:
                result.append(" ".join(current))
                current = []
            current.append(sentence)
        if current:
            result.append(" ".join(current))
        return result

    def _enrich_block(self, block: str) -> str:
        additions: list[str] = []
        formulas = [
            next(group for group in match.groups() if group is not None).strip()
            for match in self._BLOCK_FORMULA.finditer(block)
        ]
        formulas.extend(
            match.group(1).strip() for match in self._INLINE_FORMULA.finditer(block)
        )
        for formula in formulas:
            additions.append(
                "[FORMULA]\n"
                f"Readable: {self._normalize_latex(formula)}\n"
                f"Original LaTeX: {formula}\n"
                "[/FORMULA]"
            )

        table_description = self._describe_table(block)
        if table_description:
            additions.append(f"[TABLE]\n{table_description}\n[/TABLE]")

        for caption, source in self._IMAGE.findall(block):
            image_lines = ["[IMAGE]", f"source: {source}"]
            if caption.strip():
                image_lines.append(f"caption: {caption.strip()}")
            image_lines.append("[/IMAGE]")
            additions.append("\n".join(image_lines))
        return "\n\n".join([block, *additions])

    @classmethod
    def _normalize_latex(cls, latex: str) -> str:
        normalized = latex.strip()
        fraction = re.compile(r"\\frac\{([^{}]+)\}\{([^{}]+)\}")
        while fraction.search(normalized):
            normalized = fraction.sub(r"(\1) / (\2)", normalized)
        for source, target in {
            r"\cdot": " * ",
            r"\times": " × ",
            r"\div": " / ",
            r"\in": " belongs to ",
            r"\mathbb{R}": "R",
            "^{2}": "²",
            "^2": "²",
        }.items():
            normalized = normalized.replace(source, target)
        normalized = re.sub(r"\\(?:left|right)", "", normalized)
        normalized = re.sub(r"/ \(([A-Za-z0-9_²]+)\)", r"/ \1", normalized)
        return re.sub(r"\s+", " ", normalized).strip()

    def _describe_table(self, block: str) -> str | None:
        if not self._looks_like_table(block):
            return None
        rows = [self._split_table_row(line) for line in block.splitlines()]
        headers = rows[0]
        data_rows = rows[2:] if self._is_separator_row(rows[1]) else rows[1:]
        descriptions: list[str] = []
        for row in data_rows:
            values = [
                f"{header}={value}"
                for header, value in zip(headers, row, strict=False)
                if header and value
            ]
            if values:
                descriptions.append("; ".join(values))
        return "\n".join(descriptions) or None

    @staticmethod
    def _split_table_row(line: str) -> list[str]:
        return [cell.strip() for cell in line.strip().strip("|").split("|")]

    @classmethod
    def _is_separator_row(cls, row: list[str]) -> bool:
        return bool(row) and all(cls._TABLE_SEPARATOR.match(cell) for cell in row)

    @classmethod
    def _looks_like_table(cls, block: str) -> bool:
        lines = block.splitlines()
        return (
            len(lines) >= 2
            and "|" in lines[0]
            and cls._is_separator_row(cls._split_table_row(lines[1]))
        )

    @staticmethod
    def estimate_tokens(text: str) -> int:
        pieces = re.findall(r"[\wÀ-ỹ]+|[^\w\s]", text, flags=re.UNICODE)
        return max(1, math.ceil(len(pieces) * 1.05))
