import asyncio
import gzip
import io
import json
import stat
import tarfile
import zipfile
from pathlib import PurePosixPath
from typing import Any, BinaryIO
from urllib.parse import urlparse

import fitz
import httpx
import py7zr
import rarfile
from app.config import settings
from app.infrastructure.clients.minio_client import MinioClient
from py7zr.io import BytesIOFactory

from worker_evaluate_homework.domain import InvalidArtifactError, SourceFile

SUPPORTED_SUBMISSION_SUFFIXES = (".zip", ".rar", ".7z", ".tar.gz", ".gz")
SUPPORTED_SOURCE_SUFFIXES = (".py", ".ipynb")
_PYTHON_BODY_CELL_MAGICS = {"%%capture", "%%debug", "%%prun", "%%time", "%%timeit"}
_READ_CHUNK_SIZE = 64 * 1024
_MAX_MEMBER_NAME_LENGTH = 512


class S3HomeworkArtifactReader:
    def __init__(
        self,
        http_client: httpx.AsyncClient,
        storage: MinioClient,
    ) -> None:
        self._http = http_client
        self._storage = storage

    async def read_homework_text(self, object_key: str | None) -> str:
        if not object_key:
            return ""
        content = await self._download(
            object_key,
            settings.homework_grading_max_attachment_bytes,
        )
        filename = urlparse(object_key).path.casefold()
        if filename.endswith(".pdf"):
            # Keep legacy attachments readable; newly uploaded attachments are ZIP-only.
            pdf_files = [("attachment.pdf", content)]
        elif filename.endswith(".zip"):
            pdf_files = await asyncio.to_thread(
                self._read_pdfs_from_zip,
                content,
            )
        else:
            raise InvalidArtifactError(
                "File đề dùng để chấm tự động phải là ZIP"
            )
        if not pdf_files:
            return ""
        parts = [
            f"### PDF: {name}\n{await asyncio.to_thread(self._extract_pdf_text, data)}"
            for name, data in pdf_files
        ]
        return "\n\n".join(parts)[: settings.homework_grading_max_source_chars]

    async def read_submission_sources(
        self,
        object_key: str,
    ) -> list[SourceFile]:
        filename = urlparse(object_key).path.casefold()
        if not filename.endswith(SUPPORTED_SUBMISSION_SUFFIXES):
            raise InvalidArtifactError(
                "Bài nộp phải là file .zip, .rar, .7z, .tar.gz hoặc .gz"
            )
        content = await self._download(
            object_key,
            settings.homework_max_file_size_bytes,
        )
        return await asyncio.to_thread(
            self._read_python_sources,
            content,
            object_key,
        )

    async def _download(self, object_key: str, max_bytes: int) -> bytes:
        parsed = urlparse(object_key)
        url = (
            object_key
            if parsed.scheme in {"http", "https"}
            else self._storage.generate_presigned_download_url(
                settings.s3_bucket_name,
                object_key,
                settings.presigned_url_expire_seconds,
            )
        )
        chunks: list[bytes] = []
        total = 0
        async with self._http.stream(
            "GET",
            url,
            timeout=settings.homework_grading_timeout_seconds,
        ) as response:
            response.raise_for_status()
            content_length = response.headers.get("content-length")
            if content_length and int(content_length) > max_bytes:
                raise InvalidArtifactError("File vượt quá giới hạn xử lý của worker")
            async for chunk in response.aiter_bytes():
                total += len(chunk)
                if total > max_bytes:
                    raise InvalidArtifactError(
                        "File vượt quá giới hạn xử lý của worker"
                    )
                chunks.append(chunk)
        return b"".join(chunks)

    @staticmethod
    def _read_pdfs_from_zip(content: bytes) -> list[tuple[str, bytes]]:
        try:
            with zipfile.ZipFile(io.BytesIO(content)) as archive:
                entries = archive.infolist()
                _ensure_entry_count(len(entries))
                pdf_entries = [
                    info
                    for info in entries
                    if not info.is_dir()
                    and _safe_member_name(info.filename).casefold().endswith(".pdf")
                    and not _is_metadata_file(info.filename)
                ]
                total_size = sum(entry.file_size for entry in pdf_entries)
                if total_size > settings.homework_grading_max_attachment_bytes:
                    raise InvalidArtifactError(
                        "Tổng dung lượng PDF trong ZIP vượt quá giới hạn xử lý"
                    )
                result: list[tuple[str, bytes]] = []
                for entry in sorted(
                    pdf_entries,
                    key=lambda item: item.filename.casefold(),
                ):
                    if entry.flag_bits & 0x1:
                        raise InvalidArtifactError(
                            f"File {entry.filename} có mật khẩu nên worker không thể đọc"
                        )
                    result.append(
                        (_safe_member_name(entry.filename), archive.read(entry))
                    )
                return result
        except InvalidArtifactError:
            raise
        except (RuntimeError, zipfile.BadZipFile) as exc:
            raise InvalidArtifactError("File đề bài không phải ZIP hợp lệ") from exc

    @staticmethod
    def _extract_pdf_text(content: bytes) -> str:
        try:
            with fitz.open(stream=content, filetype="pdf") as document:
                text = "\n\n".join(page.get_text() for page in document)
        except Exception as exc:
            raise InvalidArtifactError("Không thể đọc PDF đề bài") from exc
        if not text.strip():
            raise InvalidArtifactError(
                "PDF không có nội dung text; hãy bổ sung mô tả bài tập"
            )
        return text[: settings.homework_grading_max_source_chars]

    @staticmethod
    def _read_python_sources(
        content: bytes,
        filename: str,
    ) -> list[SourceFile]:
        lowered = filename.casefold()
        if lowered.endswith(".tar.gz"):
            return _read_tar_sources(content)
        if lowered.endswith(".zip"):
            return _read_zip_sources(content)
        if lowered.endswith(".rar"):
            return _read_rar_sources(content)
        if lowered.endswith(".7z"):
            return _read_7z_sources(content)
        if lowered.endswith(".gz"):
            return _read_gzip_source(content, filename)
        raise InvalidArtifactError("Định dạng file bài nộp không được hỗ trợ")


def _read_zip_sources(content: bytes) -> list[SourceFile]:
    try:
        with zipfile.ZipFile(io.BytesIO(content)) as archive:
            entries = archive.infolist()
            _ensure_entry_count(len(entries))
            selected = _select_source_entries(

                    (info.filename, info.file_size, info)
                    for info in entries
                    if not info.is_dir()

            )
            result: list[SourceFile] = []
            for name, _, info in selected:
                if info.flag_bits & 0x1:
                    raise InvalidArtifactError(
                        f"File {name} có mật khẩu nên worker không thể đọc"
                    )
                if stat.S_ISLNK(info.external_attr >> 16):
                    raise InvalidArtifactError(
                        "Bài nộp ZIP không được chứa symbolic link"
                    )
                result.append(
                    SourceFile(
                        name=name,
                        content=_decode_source_file(
                            name,
                            _ensure_size(archive.read(info)),
                        ),
                    )
                )
            return result
    except InvalidArtifactError:
        raise
    except (RuntimeError, zipfile.BadZipFile) as exc:
        raise InvalidArtifactError("Bài nộp không phải ZIP hợp lệ") from exc


def _read_tar_sources(content: bytes) -> list[SourceFile]:
    try:
        with tarfile.open(fileobj=io.BytesIO(content), mode="r:gz") as archive:
            entries: list[tarfile.TarInfo] = []
            for info in archive:
                entries.append(info)
                _ensure_entry_count(len(entries))
            for info in entries:
                if info.issym() or info.islnk():
                    raise InvalidArtifactError(
                        "Bài nộp TAR.GZ không được chứa symbolic link"
                    )
            selected = _select_source_entries(
                (info.name, info.size, info) for info in entries if info.isfile()
            )
            result: list[SourceFile] = []
            for name, _, info in selected:
                stream = archive.extractfile(info)
                if stream is None:
                    raise InvalidArtifactError(f"Không thể đọc file {name}")
                with stream:
                    raw = _read_limited(stream)
                result.append(
                    SourceFile(name=name, content=_decode_source_file(name, raw))
                )
            return result
    except InvalidArtifactError:
        raise
    except (gzip.BadGzipFile, tarfile.TarError) as exc:
        raise InvalidArtifactError("Bài nộp không phải TAR.GZ hợp lệ") from exc


def _read_gzip_source(content: bytes, filename: str) -> list[SourceFile]:
    archive_name = PurePosixPath(filename.replace("\\", "/")).name
    inner_name = archive_name[:-3]
    if not inner_name.casefold().endswith(SUPPORTED_SOURCE_SUFFIXES):
        inner_name = f"{inner_name}.py"
    name = _safe_member_name(inner_name)
    try:
        with gzip.GzipFile(fileobj=io.BytesIO(content), mode="rb") as stream:
            raw = _read_limited(stream)
    except (EOFError, gzip.BadGzipFile, OSError) as exc:
        raise InvalidArtifactError("Bài nộp không phải GZ hợp lệ") from exc
    return [SourceFile(name=name, content=_decode_source_file(name, raw))]


def _read_7z_sources(content: bytes) -> list[SourceFile]:
    try:
        with py7zr.SevenZipFile(io.BytesIO(content), mode="r") as archive:
            if archive.needs_password():
                raise InvalidArtifactError(
                    "File 7Z có mật khẩu nên worker không thể đọc"
                )
            infos = archive.list()
            _ensure_entry_count(len(infos))
            if any(info.is_symlink for info in infos):
                raise InvalidArtifactError("Bài nộp 7Z không được chứa symbolic link")
            selected = _select_source_entries(

                    (info.filename, info.uncompressed, info.filename)
                    for info in infos
                    if info.is_file

            )
            factory = BytesIOFactory(
                limit=settings.homework_grading_max_source_bytes + 1
            )
            archive.extract(
                targets=[raw_name for _, _, raw_name in selected],
                factory=factory,
            )
            result: list[SourceFile] = []
            for name, _, raw_name in selected:
                product = factory.get(raw_name)
                product.seek(0)
                raw = _ensure_size(product.read())
                result.append(
                    SourceFile(name=name, content=_decode_source_file(name, raw))
                )
            return result
    except InvalidArtifactError:
        raise
    except Exception as exc:
        raise InvalidArtifactError("Bài nộp không phải 7Z hợp lệ") from exc


def _read_rar_sources(content: bytes) -> list[SourceFile]:
    try:
        with rarfile.RarFile(io.BytesIO(content)) as archive:
            infos = archive.infolist()
            _ensure_entry_count(len(infos))
            selected = _select_source_entries(

                    (info.filename, info.file_size, info)
                    for info in infos
                    if not info.is_dir()

            )
            result: list[SourceFile] = []
            for name, _, info in selected:
                if info.file_redir:
                    raise InvalidArtifactError(
                        "Bài nộp RAR không được chứa symbolic link"
                    )
                if info.needs_password():
                    raise InvalidArtifactError(
                        f"File {name} có mật khẩu nên worker không thể đọc"
                    )
                with archive.open(info) as stream:
                    raw = _read_limited(stream)
                result.append(
                    SourceFile(name=name, content=_decode_source_file(name, raw))
                )
            return result
    except InvalidArtifactError:
        raise
    except rarfile.RarCannotExec as exc:
        raise RuntimeError("Worker thiếu công cụ hệ thống để giải nén RAR") from exc
    except rarfile.Error as exc:
        raise InvalidArtifactError("Bài nộp không phải RAR hợp lệ") from exc


def _select_source_entries(
    entries,
) -> list[tuple[str, int, Any]]:
    selected: list[tuple[str, int, Any]] = []
    seen: set[str] = set()
    total_size = 0
    for raw_name, raw_size, payload in entries:
        name = _safe_member_name(raw_name)
        if _is_metadata_file(name) or not name.casefold().endswith(
            SUPPORTED_SOURCE_SUFFIXES
        ):
            continue
        size = int(raw_size)
        if size < 0:
            raise InvalidArtifactError(f"Kích thước file {name} không hợp lệ")
        key = name.casefold()
        if key in seen:
            raise InvalidArtifactError(f"Archive chứa file trùng tên: {name}")
        seen.add(key)
        total_size += size
        if total_size > settings.homework_grading_max_source_bytes:
            raise InvalidArtifactError("Source code sau giải nén vượt quá giới hạn")
        selected.append((name, size, payload))
        if len(selected) > settings.homework_grading_max_files:
            raise InvalidArtifactError(
                "Bài nộp có quá nhiều file code "
                f"(tối đa {settings.homework_grading_max_files})"
            )
    if not selected:
        raise InvalidArtifactError(
            "Bài nộp không chứa file Python (.py) hoặc notebook Jupyter (.ipynb)"
        )
    return sorted(selected, key=lambda item: item[0].casefold())


def _safe_member_name(raw_name: str) -> str:
    value = str(raw_name).replace("\\", "/")
    if "\x00" in value or len(value) > _MAX_MEMBER_NAME_LENGTH:
        raise InvalidArtifactError("Archive chứa tên file không hợp lệ")
    path = PurePosixPath(value)
    if path.is_absolute() or any(part == ".." for part in path.parts):
        raise InvalidArtifactError(f"Archive chứa đường dẫn không an toàn: {raw_name}")
    normalized = "/".join(part for part in path.parts if part not in {"", "."})
    if not normalized:
        raise InvalidArtifactError("Archive chứa tên file rỗng")
    return normalized


def _is_metadata_file(name: str) -> bool:
    path = PurePosixPath(name.replace("\\", "/"))
    return any(
        part.casefold() == "__macosx" for part in path.parts
    ) or path.name.startswith("._")


def _ensure_entry_count(count: int) -> None:
    if count > settings.homework_grading_max_archive_entries:
        raise InvalidArtifactError(
            "Archive có quá nhiều mục "
            f"(tối đa {settings.homework_grading_max_archive_entries})"
        )


def _read_limited(stream: BinaryIO) -> bytes:
    limit = settings.homework_grading_max_source_bytes
    chunks: list[bytes] = []
    total = 0
    while True:
        chunk = stream.read(min(_READ_CHUNK_SIZE, limit - total + 1))
        if not chunk:
            break
        chunks.append(chunk)
        total += len(chunk)
        if total > limit:
            raise InvalidArtifactError("Source code sau giải nén vượt quá giới hạn")
    return b"".join(chunks)


def _ensure_size(content: bytes) -> bytes:
    if len(content) > settings.homework_grading_max_source_bytes:
        raise InvalidArtifactError("Source code sau giải nén vượt quá giới hạn")
    return content


def _decode_source(name: str, content: bytes) -> str:
    try:
        return content.decode("utf-8-sig")
    except UnicodeDecodeError:
        try:
            return content.decode("utf-8")
        except UnicodeDecodeError as exc:
            raise InvalidArtifactError(
                f"File {name} phải sử dụng bảng mã UTF-8"
            ) from exc


def _decode_source_file(name: str, content: bytes) -> str:
    decoded = _decode_source(name, content)
    if not name.casefold().endswith(".ipynb"):
        return decoded
    return _extract_notebook_content(name, decoded)


def _extract_notebook_content(name: str, content: str) -> str:
    try:
        notebook = json.loads(content)
    except json.JSONDecodeError as exc:
        raise InvalidArtifactError(f"Notebook {name} không phải JSON hợp lệ") from exc

    cells = notebook.get("cells") if isinstance(notebook, dict) else None
    if not isinstance(cells, list):
        raise InvalidArtifactError(f"Notebook {name} không có danh sách cells hợp lệ")

    rendered_cells: list[str] = []
    for index, cell in enumerate(cells, start=1):
        if not isinstance(cell, dict):
            raise InvalidArtifactError(f"Notebook {name} có cell #{index} không hợp lệ")
        cell_type = cell.get("cell_type")
        if cell_type not in {"code", "markdown", "raw"}:
            continue
        source = _notebook_text(
            cell.get("source", ""),
            error_message=f"Notebook {name} có {cell_type} cell #{index} không hợp lệ",
        )

        if cell_type == "code":
            if source.strip():
                rendered_cells.append(
                    f"# --- code cell {index} ---\n"
                    f"{_normalize_notebook_code(source).rstrip()}"
                )
            outputs = cell.get("outputs", [])
            if not isinstance(outputs, list):
                raise InvalidArtifactError(
                    f"Notebook {name} có outputs của cell #{index} không hợp lệ"
                )
            for output_index, output in enumerate(outputs, start=1):
                output_text = _notebook_output_text(output)
                if output_text.strip():
                    rendered_cells.append(
                        _comment_notebook_text(
                            f"output {index}.{output_index}",
                            output_text,
                        )
                    )
        elif source.strip():
            rendered_cells.append(
                _comment_notebook_text(f"{cell_type} cell {index}", source)
            )

    if not rendered_cells:
        raise InvalidArtifactError(f"Notebook {name} không chứa nội dung có thể chấm")
    return "\n\n".join(rendered_cells) + "\n"


def _notebook_text(value: Any, *, error_message: str) -> str:
    if isinstance(value, str):
        return value
    if isinstance(value, list) and all(isinstance(item, str) for item in value):
        return "".join(value)
    raise InvalidArtifactError(error_message)


def _notebook_output_text(output: Any) -> str:
    if not isinstance(output, dict):
        return ""
    output_type = output.get("output_type")
    if output_type == "stream":
        return _notebook_text(
            output.get("text", ""),
            error_message="Notebook có stream output không hợp lệ",
        )
    if output_type == "error":
        traceback = _notebook_text(
            output.get("traceback", []),
            error_message="Notebook có traceback output không hợp lệ",
        )
        summary = ": ".join(
            str(value)
            for value in (output.get("ename"), output.get("evalue"))
            if value
        )
        return "\n".join(value for value in (summary, traceback) if value)
    if output_type not in {"display_data", "execute_result"}:
        return ""
    data = output.get("data", {})
    if not isinstance(data, dict):
        return ""
    for mime_type in (
        "text/markdown",
        "text/plain",
        "application/json",
        "text/html",
    ):
        if mime_type not in data:
            continue
        value = data[mime_type]
        if mime_type == "application/json":
            if isinstance(value, str):
                return value
            if isinstance(value, list) and all(
                isinstance(item, str) for item in value
            ):
                return "".join(value)
            return json.dumps(value, ensure_ascii=False)
        return _notebook_text(
            value,
            error_message=f"Notebook có output {mime_type} không hợp lệ",
        )
    return ""


def _comment_notebook_text(label: str, content: str) -> str:
    lines = content.splitlines() or [""]
    commented = "\n".join(f"# {line}" if line else "#" for line in lines)
    return f"# --- {label} ---\n{commented}"


def _normalize_notebook_code(code: str) -> str:
    """Turn IPython-only commands into valid Python without executing them."""
    lines = code.splitlines()
    first_content = next((line.lstrip() for line in lines if line.strip()), "")
    if first_content.startswith("%%"):
        magic = first_content.split(maxsplit=1)[0].casefold()
        if magic not in _PYTHON_BODY_CELL_MAGICS:
            return "\n".join(
                f"# Jupyter cell magic ignored: {line}" if line else "#"
                for line in lines
            )

    normalized: list[str] = []
    for line in lines:
        stripped = line.lstrip()
        if stripped.startswith(("!", "%", "?")):
            indentation = line[: len(line) - len(stripped)]
            normalized.append(
                f"{indentation}pass  # Jupyter command ignored: {stripped}"
            )
        else:
            normalized.append(line)
    return "\n".join(normalized)
