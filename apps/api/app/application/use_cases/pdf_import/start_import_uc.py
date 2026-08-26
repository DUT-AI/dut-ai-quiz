"""
StartImportUseCase — Step 1+2:
- Validate PDF
- Khởi tạo ImportSession trong DB
- Chạy AI parse pipeline (FastAPI BackgroundTasks)
- Trả về job_id ngay lập tức (202 Accepted)
"""
from __future__ import annotations

import uuid
from uuid import UUID

from fastapi import BackgroundTasks
from loguru import logger

from app.application.services.pdf_ai_parser import PDFAIParserService, PDFValidationResult
from app.config import settings
from app.domain.entities.import_session import ImportSessionEntity
from app.domain.entities.question import QuestionEntity, QuestionOptionEntity
from app.domain.interfaces.import_session_repo import IImportSessionRepository
from app.domain.interfaces.question_repo import IQuestionRepository
from app.domain.value_objects import Difficulty, PoolType
from app.core.datetime_utils import now_ict


class StartImportUseCase:
    def __init__(
        self,
        import_session_repo: IImportSessionRepository,
        question_repo: IQuestionRepository,
        ai_parser: PDFAIParserService,
    ) -> None:
        self._import_repo = import_session_repo
        self._question_repo = question_repo
        self._ai_parser = ai_parser

    async def execute(
        self,
        pdf_bytes: bytes,
        file_name: str,
        user_id: int,
        background_tasks: BackgroundTasks,
        lesson_id: UUID | None = None,
        target_scope: str = "LESSON",
    ) -> dict:
        """
        Validate PDF, tạo session record và enqueue background task.
        Trả về {"job_id": ..., "status": "PROCESSING"} ngay lập tức.
        """
        # Step 1: Validate
        validation = self._ai_parser.validate_pdf(pdf_bytes, file_name)
        if not validation.ok:
            return {
                "ok": False,
                "error": validation.error,
                "is_encrypted": validation.is_encrypted,
            }

        # Step 2: Create session record
        job_id = uuid.uuid4()
        entity = ImportSessionEntity(
            id=job_id,
            user_id=user_id,
            file_name=file_name,
            status="PROCESSING",
            lesson_id=lesson_id,
            target_scope=target_scope,
        )
        await self._import_repo.create(entity)

        # Enqueue background processing
        background_tasks.add_task(
            self._run_import_pipeline,
            pdf_bytes=pdf_bytes,
            job_id=job_id,
            user_id=user_id,
            lesson_id=lesson_id,
        )

        return {"ok": True, "job_id": str(job_id), "status": "PROCESSING"}

    async def execute_with_password(
        self,
        pdf_bytes: bytes,
        file_name: str,
        password: str,
        user_id: int,
        background_tasks: BackgroundTasks,
        lesson_id: UUID | None = None,
        target_scope: str = "LESSON",
    ) -> dict:
        """Giải mã PDF trước khi validate và import."""
        decrypted = self._ai_parser.try_decrypt_pdf(pdf_bytes, password)
        if decrypted is None:
            return {"ok": False, "error": "Mật khẩu PDF không đúng"}

        return await self.execute(
            pdf_bytes=decrypted,
            file_name=file_name,
            user_id=user_id,
            background_tasks=background_tasks,
            lesson_id=lesson_id,
            target_scope=target_scope,
        )

    # ------------------------------------------------------------------
    # Background pipeline
    # ------------------------------------------------------------------

    async def _run_import_pipeline(
        self,
        pdf_bytes: bytes,
        job_id: UUID,
        user_id: int,
        lesson_id: UUID | None,
    ) -> None:
        """
        Chạy pipeline AI trong background:
        Step 3-6: Render → Gemini OCR → Save DRAFT questions (Bulk Insert)
        """
        job_str = str(job_id)
        logger.info(f"[Import {job_str}] Starting AI pipeline")

        try:
            parsed_questions = await self._ai_parser.parse_pdf_with_ai(
                pdf_bytes=pdf_bytes,
                job_id=job_str,
            )

            await self._import_repo.update_progress(
                job_id,
                total_questions=len(parsed_questions),
                processed_questions=0,
            )

            # Map AI parsed questions into QuestionEntity list in memory
            diff_map = {
                "EASY": Difficulty.EASY,
                "MEDIUM": Difficulty.MEDIUM,
                "HARD": Difficulty.HARD,
            }

            question_entities: list[QuestionEntity] = []
            for pq in parsed_questions:
                options = [
                    QuestionOptionEntity(
                        id=opt.id,
                        text=opt.text,
                        is_correct=opt.is_correct,
                        fixed=opt.fixed,
                    )
                    for opt in pq.options
                ]
                difficulty = diff_map.get(pq.difficulty.upper(), Difficulty.MEDIUM)

                entity = QuestionEntity(
                    id=uuid.uuid4(),
                    pool_type=PoolType.EXAM,
                    difficulty=difficulty,
                    content=pq.content,
                    options=options,
                    solution=pq.solution,
                    lesson_id=lesson_id,
                    tags=[],
                    created_by=user_id,
                    created_at=now_ict(),
                    status="DRAFT",
                    import_session_id=job_id,
                    is_answer_ai_generated=pq.is_answer_ai_generated,
                    is_solution_ai_generated=pq.is_solution_ai_generated,
                    is_difficulty_ai_suggested=pq.is_difficulty_ai_suggested,
                    duplicate_status="UNIQUE",
                )
                question_entities.append(entity)

            # Bulk insert all questions at once
            if question_entities:
                await self._question_repo.add_bulk(question_entities)

            await self._import_repo.update_progress(
                job_id,
                total_questions=len(parsed_questions),
                processed_questions=len(parsed_questions),
            )
            await self._import_repo.update_status(job_id, "COMPLETED")
            logger.info(f"[Import {job_str}] Completed — {len(parsed_questions)} DRAFT questions saved")

        except Exception as exc:
            logger.exception(f"[Import {job_str}] Pipeline failed: {exc}")
            try:
                await self._import_repo.update_status(
                    job_id, "FAILED", error_message=str(exc)
                )
            except Exception:
                pass

