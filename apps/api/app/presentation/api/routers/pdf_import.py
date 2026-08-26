"""
PDF Import Router — Vision LLM OCR Pipeline (Gemini 2.0 Flash)

Endpoints:
  POST /pdf-import/upload               — Upload PDF, start async AI job
  POST /pdf-import/upload-with-password — Upload password-protected PDF
  GET  /pdf-import/{job_id}/status      — Poll job progress
  GET  /pdf-import/{job_id}/questions   — List DRAFT questions for review
  PATCH /pdf-import/questions/{id}/approve  — Approve DRAFT → PUBLIC
  DELETE /pdf-import/questions/{id}         — Delete DRAFT + cleanup MinIO
  POST /pdf-import/questions/{id}/regenerate-solution — AI re-generate
  POST /pdf-import/questions/{id}/lock       — Acquire review lock
  POST /pdf-import/questions/{id}/heartbeat  — Renew lock TTL
"""

from __future__ import annotations

from uuid import UUID

from dishka.integrations.fastapi import FromDishka, inject
from fastapi import APIRouter, BackgroundTasks, File, Form, HTTPException, UploadFile

from app.application.use_cases.pdf_import import (
    AcquireLockUseCase,
    ApproveQuestionUseCase,
    GetImportStatusUseCase,
    HeartbeatLockUseCase,
    RejectQuestionUseCase,
    RegenerateSolutionUseCase,
    ReviewDraftQuestionsUseCase,
    StartImportUseCase,
)
from app.presentation.api.deps import EducatorUser, CurrentUser
from app.presentation.schemas.pdf_import_v2 import (
    ApproveQuestionRequest,
    ApproveQuestionResponse,
    DraftQuestionsListResponse,
    ImportSessionStatusResponse,
    LockResponse,
    PDFUploadResponse,
    RejectQuestionResponse,
    RegenerateSolutionRequest,
    RegenerateSolutionResponse,
)
from app.presentation.schemas.pdf_import import StartPdfImportResponse
from app.application.use_cases.questions.start_pdf_import_uc import (
    StartPdfImportUseCase,
)

router = APIRouter(prefix="/pdf-import", tags=["pdf-import"])

# ---------------------------------------------------------------------------
# STEP 1+2: Upload & Start Async Job
# ---------------------------------------------------------------------------


@router.post("/import-pdf", response_model=StartPdfImportResponse, status_code=202)
@inject
async def import_pdf_route(
    user: EducatorUser,
    use_case: FromDishka[StartPdfImportUseCase],
    file: UploadFile = File(...),
    lesson_id: str | None = Form(None),
    target_scope: str = Form("LESSON"),
    password: str | None = Form(None),
):
    """
    Upload PDF sử dụng cơ chế OCR nội bộ (PaddleOCR + OpenDataLoader).
    Gửi việc qua ARQ Queue thay vì chạy background task nội bộ của API.
    """
    pdf_bytes = await file.read()
    try:
        return await use_case.execute(
            user_id=user.id,
            pdf_bytes=pdf_bytes,
            file_name=file.filename,
            lesson_id=lesson_id,
            target_scope=target_scope,
            password=password,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail={"error": str(e)})


@router.post("/upload", response_model=PDFUploadResponse, status_code=202)
@inject
async def upload_pdf(
    user: EducatorUser,
    uc: FromDishka[StartImportUseCase],
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    lesson_id: str | None = Form(None),
    target_scope: str = Form("LESSON"),
):
    """
    Upload PDF trắc nghiệm. Trả về job_id ngay lập tức (202).
    AI xử lý bất đồng bộ trong background.
    """
    pdf_bytes = await file.read()

    lid = None
    if lesson_id and str(lesson_id).strip() not in ("undefined", "null", ""):
        try:
            lid = UUID(str(lesson_id).strip())
        except ValueError:
            pass  # ignore invalid uuid

    result = await uc.execute(
        pdf_bytes=pdf_bytes,
        file_name=file.filename or "upload.pdf",
        user_id=user.id,
        background_tasks=background_tasks,
        lesson_id=lid,
        target_scope=target_scope,
    )

    if not result["ok"]:
        if result.get("is_encrypted"):
            return PDFUploadResponse(
                ok=False,
                error=result["error"],
                is_encrypted=True,
            )
        raise HTTPException(status_code=422, detail=result["error"])

    return PDFUploadResponse(
        ok=True,
        job_id=result["job_id"],
        status=result["status"],
    )


@router.post("/upload-with-password", response_model=PDFUploadResponse, status_code=202)
@inject
async def upload_pdf_with_password(
    user: EducatorUser,
    uc: FromDishka[StartImportUseCase],
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    password: str = Form(...),
    lesson_id: str | None = Form(None),
    target_scope: str = Form("LESSON"),
):
    """Upload PDF có mật khẩu bảo vệ."""
    pdf_bytes = await file.read()
    lid = UUID(lesson_id) if lesson_id else None

    result = await uc.execute_with_password(
        pdf_bytes=pdf_bytes,
        file_name=file.filename or "upload.pdf",
        password=password,
        user_id=user.id,
        background_tasks=background_tasks,
        lesson_id=lid,
        target_scope=target_scope,
    )

    if not result["ok"]:
        raise HTTPException(status_code=422, detail=result["error"])

    return PDFUploadResponse(
        ok=True,
        job_id=result["job_id"],
        status=result["status"],
    )


# ---------------------------------------------------------------------------
# Poll job status
# ---------------------------------------------------------------------------


@router.get("/{job_id}/status", response_model=ImportSessionStatusResponse)
@inject
async def get_import_status(
    job_id: UUID,
    user: EducatorUser,
    uc: FromDishka[GetImportStatusUseCase],
):
    """Poll trạng thái xử lý PDF import job."""
    result = await uc.execute(job_id=job_id, user_id=user.id)
    return ImportSessionStatusResponse(**result)


# ---------------------------------------------------------------------------
# STEP 7: Review DRAFT questions
# ---------------------------------------------------------------------------


@router.get("/{job_id}/questions", response_model=DraftQuestionsListResponse)
@inject
async def list_draft_questions(
    job_id: UUID,
    user: EducatorUser,
    uc: FromDishka[ReviewDraftQuestionsUseCase],
    offset: int = 0,
    limit: int = 50,
):
    """Lấy danh sách câu hỏi DRAFT để admin review."""
    questions = await uc.execute(import_session_id=job_id, offset=offset, limit=limit)
    return DraftQuestionsListResponse(questions=questions, total=len(questions))


# ---------------------------------------------------------------------------
# STEP 8: Approve → PUBLIC
# ---------------------------------------------------------------------------


@router.patch(
    "/questions/{question_id}/approve", response_model=ApproveQuestionResponse
)
@inject
async def approve_question(
    question_id: UUID,
    body: ApproveQuestionRequest,
    user: EducatorUser,
    uc: FromDishka[ApproveQuestionUseCase],
):
    """Duyệt câu hỏi DRAFT thành PUBLIC. Admin có thể chỉnh sửa trước khi duyệt."""
    result = await uc.execute(
        question_id=question_id,
        admin_id=user.id,
        updated_content=body.content,
        updated_solution=body.solution,
        updated_difficulty=body.difficulty,
        updated_lesson_id=body.lesson_id,
    )
    if not result["ok"]:
        raise HTTPException(status_code=409, detail=result["error"])
    return ApproveQuestionResponse(**result)


# ---------------------------------------------------------------------------
# Delete DRAFT question (cleanup MinIO)
# ---------------------------------------------------------------------------


@router.delete("/questions/{question_id}", response_model=RejectQuestionResponse)
@inject
async def reject_question(
    question_id: UUID,
    user: EducatorUser,
    uc: FromDishka[RejectQuestionUseCase],
):
    """Xóa câu hỏi DRAFT và dọn sạch ảnh trên MinIO."""
    result = await uc.execute(question_id=question_id, admin_id=user.id)
    if not result["ok"]:
        raise HTTPException(status_code=404, detail=result["error"])
    return RejectQuestionResponse(**result)


# ---------------------------------------------------------------------------
# AI Regenerate Solution
# ---------------------------------------------------------------------------


@router.post(
    "/questions/{question_id}/regenerate-solution",
    response_model=RegenerateSolutionResponse,
)
@inject
async def regenerate_solution(
    question_id: UUID,
    body: RegenerateSolutionRequest,
    user: EducatorUser,
    uc: FromDishka[RegenerateSolutionUseCase],
):
    """🪄 Gọi Gemini AI sinh lại lời giải cho câu hỏi."""
    result = await uc.execute(question_id=question_id, admin_hint=body.admin_hint)
    if not result["ok"]:
        raise HTTPException(status_code=500, detail=result["error"])
    return RegenerateSolutionResponse(**result)


# ---------------------------------------------------------------------------
# Redis Lock (Multi-admin concurrency control)
# ---------------------------------------------------------------------------


@router.post("/questions/{question_id}/lock", response_model=LockResponse)
@inject
async def acquire_lock(
    question_id: UUID,
    user: EducatorUser,
    uc: FromDishka[AcquireLockUseCase],
):
    """Chiếm review lock khi admin mở câu hỏi DRAFT để chỉnh sửa."""
    result = await uc.execute(question_id=question_id, admin_id=user.id)
    return LockResponse(**result)


@router.post("/questions/{question_id}/heartbeat", response_model=LockResponse)
@inject
async def heartbeat_lock(
    question_id: UUID,
    user: EducatorUser,
    uc: FromDishka[HeartbeatLockUseCase],
):
    """Gia hạn review lock TTL (frontend gọi mỗi 30 giây)."""
    result = await uc.execute(question_id=question_id, admin_id=user.id)
    return LockResponse(**result)
