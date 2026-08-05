import asyncio
import gzip
import io
import stat
import tarfile
import zipfile
from pathlib import PurePosixPath
from typing import Any, BinaryIO

import fitz
import httpx
import py7zr
import rarfile
from py7zr.io import BytesIOFactory

from app.config import settings
from app.infrastructure.clients.minio_client import MinioClient
from worker_evaluate_homework.domain import InvalidArtifactError, SourceFile


SUPPORTED_SUBMISSION_SUFFIXES = (".zip", ".rar", ".7z", ".tar.gz", ".gz")
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
        filename = object_key.casefold()
        if filename.endswith(".pdf"):
            pdf_bytes = content
        elif filename.endswith(".zip"):
            pdf_bytes = await asyncio.to_thread(
                self._read_single_pdf_from_zip,
                content,
            )
        else:
            raise InvalidArtifactError(
                "File đề dùng để chấm tự động phải là PDF hoặc ZIP chứa một PDF"
            )
        return await asyncio.to_thread(self._extract_pdf_text, pdf_bytes)

    async def read_submission_sources(
        self,
        object_key: str,
    ) -> list[SourceFile]:
        filename = object_key.casefold()
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
        url = self._storage.generate_presigned_download_url(
            settings.s3_bucket_name,
            object_key,
            settings.presigned_url_expire_seconds,
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
    def _read_single_pdf_from_zip(content: bytes) -> bytes:
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
                if len(pdf_entries) != 1:
                    raise InvalidArtifactError(
                        "File ZIP đề bài phải chứa đúng một file PDF"
                    )
                entry = pdf_entries[0]
                if entry.flag_bits & 0x1:
                    raise InvalidArtifactError(
                        "File ZIP đề bài có mật khẩu nên worker không thể đọc"
                    )
                if entry.file_size > settings.homework_grading_max_attachment_bytes:
                    raise InvalidArtifactError("PDF đề bài vượt quá giới hạn xử lý")
                return archive.read(entry)
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
            selected = _select_python_entries(
                (
                    (info.filename, info.file_size, info)
                    for info in entries
                    if not info.is_dir()
                )
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
                        content=_decode_source(
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
            selected = _select_python_entries(
                ((info.name, info.size, info) for info in entries if info.isfile())
            )
            result: list[SourceFile] = []
            for name, _, info in selected:
                stream = archive.extractfile(info)
                if stream is None:
                    raise InvalidArtifactError(f"Không thể đọc file {name}")
                with stream:
                    raw = _read_limited(stream)
                result.append(SourceFile(name=name, content=_decode_source(name, raw)))
            return result
    except InvalidArtifactError:
        raise
    except (gzip.BadGzipFile, tarfile.TarError) as exc:
        raise InvalidArtifactError("Bài nộp không phải TAR.GZ hợp lệ") from exc


def _read_gzip_source(content: bytes, filename: str) -> list[SourceFile]:
    archive_name = PurePosixPath(filename.replace("\\", "/")).name
    inner_name = archive_name[:-3]
    if not inner_name.casefold().endswith(".py"):
        inner_name = f"{inner_name}.py"
    name = _safe_member_name(inner_name)
    try:
        with gzip.GzipFile(fileobj=io.BytesIO(content), mode="rb") as stream:
            raw = _read_limited(stream)
    except (EOFError, gzip.BadGzipFile, OSError) as exc:
        raise InvalidArtifactError("Bài nộp không phải GZ hợp lệ") from exc
    return [SourceFile(name=name, content=_decode_source(name, raw))]


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
            selected = _select_python_entries(
                (
                    (info.filename, info.uncompressed, info.filename)
                    for info in infos
                    if info.is_file
                )
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
                result.append(SourceFile(name=name, content=_decode_source(name, raw)))
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
            selected = _select_python_entries(
                (
                    (info.filename, info.file_size, info)
                    for info in infos
                    if not info.is_dir()
                )
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
                result.append(SourceFile(name=name, content=_decode_source(name, raw)))
            return result
    except InvalidArtifactError:
        raise
    except rarfile.RarCannotExec as exc:
        raise RuntimeError("Worker thiếu công cụ hệ thống để giải nén RAR") from exc
    except rarfile.Error as exc:
        raise InvalidArtifactError("Bài nộp không phải RAR hợp lệ") from exc


def _select_python_entries(
    entries,
) -> list[tuple[str, int, Any]]:
    selected: list[tuple[str, int, Any]] = []
    seen: set[str] = set()
    total_size = 0
    for raw_name, raw_size, payload in entries:
        name = _safe_member_name(raw_name)
        if _is_metadata_file(name) or not name.casefold().endswith(".py"):
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
                "Bài nộp có quá nhiều file Python "
                f"(tối đa {settings.homework_grading_max_files})"
            )
    if not selected:
        raise InvalidArtifactError("Bài nộp không chứa file Python")
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
