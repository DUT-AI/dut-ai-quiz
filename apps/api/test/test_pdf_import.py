import os
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from app.application.use_cases.questions.start_pdf_import_uc import StartPdfImportUseCase


@pytest.fixture
def mock_import_session_repo():
    repo = AsyncMock()
    return repo

@pytest.fixture
def mock_pdf_import_queue():
    queue = AsyncMock()
    return queue

@pytest.fixture
def mock_redis():
    redis = AsyncMock()
    redis.setnx.return_value = True  # Default: Lock acquired
    redis.expire.return_value = True
    return redis

@pytest.fixture
def use_case(mock_import_session_repo, mock_pdf_import_queue, mock_redis):
    return StartPdfImportUseCase(
        import_session_repo=mock_import_session_repo,
        pdf_import_queue=mock_pdf_import_queue,
        redis=mock_redis
    )

@patch("app.application.use_cases.questions.start_pdf_import_uc.fitz.open")
@pytest.mark.asyncio
async def test_successful_pdf_import(mock_fitz_open, use_case, mock_pdf_import_queue, mock_import_session_repo, mock_redis):
    # Mock valid PDF document
    mock_doc = MagicMock()
    mock_doc.is_encrypted = False
    mock_doc.__len__.return_value = 10 # 10 pages
    mock_fitz_open.return_value = mock_doc

    pdf_bytes = b"dummy_pdf_content"

    with patch("app.application.use_cases.questions.start_pdf_import_uc.open", new_callable=MagicMock):
        response = await use_case.execute(
            user_id=1,
            pdf_bytes=pdf_bytes,
            target_scope=None,
            password=None
        )

    assert response.status == "ACCEPTED"
    mock_import_session_repo.create.assert_called_once()
    mock_pdf_import_queue.enqueue_parse_pdf.assert_called_once_with(
        job_id=response.job_id,
        file_path=os.path.join("/tmp/pdf_uploads", f"{response.job_id}.pdf"),
        user_id=1,
        lesson_id=None,
        target_scope=None,
        password=None,
    )

@pytest.mark.asyncio
async def test_pdf_size_exceeds_limit(use_case):
    # Create mock bytes > 20MB
    large_pdf_bytes = b"0" * (21 * 1024 * 1024)

    with pytest.raises(ValueError, match="PDF size must be <= 20MB"):
        await use_case.execute(
            user_id=1,
            pdf_bytes=large_pdf_bytes,
            target_scope=None,
            password=None
        )

@patch("app.application.use_cases.questions.start_pdf_import_uc.fitz.open")
@pytest.mark.asyncio
async def test_pdf_empty(mock_fitz_open, use_case):
    # Mock empty PDF document (0 pages)
    mock_doc = MagicMock()
    mock_doc.is_encrypted = False
    mock_doc.__len__.return_value = 0
    mock_fitz_open.return_value = mock_doc

    with pytest.raises(ValueError, match="PDF must not be empty"):
        await use_case.execute(
            user_id=1,
            pdf_bytes=b"dummy_empty",
            target_scope=None,
            password=None
        )

@pytest.mark.asyncio
@patch("app.application.use_cases.questions.start_pdf_import_uc.fitz.open")
async def test_invalid_pdf_format(mock_fitz_open, use_case):
    # Force fitz.open to raise an Exception
    mock_fitz_open.side_effect = Exception("Not a PDF")

    with pytest.raises(ValueError, match="Invalid PDF format"):
        await use_case.execute(
            user_id=1,
            pdf_bytes=b"invalid_data",
            target_scope=None,
            password=None
        )

@pytest.mark.asyncio
@patch("app.application.use_cases.questions.start_pdf_import_uc.fitz.open")
async def test_pdf_locked_without_password(mock_fitz_open, use_case):
    mock_doc = MagicMock()
    mock_doc.is_encrypted = True
    mock_fitz_open.return_value = mock_doc

    with pytest.raises(ValueError, match="PDF_LOCKED"):
        await use_case.execute(
            user_id=1,
            pdf_bytes=b"locked_pdf",
            target_scope=None,
            password=None
        )

@pytest.mark.asyncio
@patch("app.application.use_cases.questions.start_pdf_import_uc.fitz.open")
async def test_pdf_invalid_password(mock_fitz_open, use_case):
    mock_doc = MagicMock()
    mock_doc.is_encrypted = True
    mock_doc.authenticate.return_value = False  # Auth failed
    mock_fitz_open.return_value = mock_doc

    with pytest.raises(ValueError, match="INVALID_PASSWORD"):
        await use_case.execute(
            user_id=1,
            pdf_bytes=b"locked_pdf",
            target_scope=None,
            password="wrong_password"
        )

@pytest.mark.asyncio
@patch("app.application.use_cases.questions.start_pdf_import_uc.fitz.open")
async def test_duplicate_upload(mock_fitz_open, use_case, mock_redis):
    mock_doc = MagicMock()
    mock_doc.is_encrypted = False
    mock_doc.__len__.return_value = 5
    mock_fitz_open.return_value = mock_doc

    # Simulate that the lock already exists
    mock_redis.setnx.return_value = False

    with pytest.raises(ValueError, match="Duplicate upload detected. Please wait."):
        await use_case.execute(
            user_id=1,
            pdf_bytes=b"same_content",
            target_scope=None,
            password=None
        )
