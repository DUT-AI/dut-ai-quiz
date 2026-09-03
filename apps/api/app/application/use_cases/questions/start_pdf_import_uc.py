import uuid
import hashlib
from datetime import datetime
import fitz  
from redis.asyncio import Redis
import os

from app.domain.entities.import_session import ImportSessionEntity, ImportSessionStatus
from app.domain.interfaces.import_session_repo import IImportSessionRepository
from app.domain.interfaces.pdf_import_queue import IPdfImportQueue
from app.presentation.schemas.pdf_import import StartPdfImportResponse

import tempfile
class StartPdfImportUseCase:
    def __init__(
        self,
        import_session_repo: IImportSessionRepository,
        pdf_import_queue: IPdfImportQueue,
        redis: Redis,
    ):
        self.import_session_repo = import_session_repo
        self.pdf_import_queue = pdf_import_queue
        self.redis = redis

    async def execute(
        self,
        user_id: int,
        pdf_bytes: bytes,
        file_name: str | None = None,
        lesson_id: str | None = None,
        target_scope: str = "LESSON",
        password: str | None = None,
    ) -> StartPdfImportResponse:
        # 1. Validation & Password checking
        if len(pdf_bytes) > 20 * 1024 * 1024:
            raise ValueError("PDF size must be <= 20MB")

        try:
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        except Exception:
            raise ValueError("Invalid PDF format")

        if doc.is_encrypted:
            if not password:
                raise ValueError("PDF_LOCKED")
            success = doc.authenticate(password)
            if not success:
                raise ValueError("INVALID_PASSWORD")

        if len(doc) < 1:
            raise ValueError("PDF must not be empty")
            
        doc.close()

        # 2. Redis Lock for Duplicate Upload prevention (TTL: 60s)
        file_hash = hashlib.md5(pdf_bytes).hexdigest()
        lock_key = f"pdf_import_lock:{user_id}:{file_hash}"
        acquired = await self.redis.setnx(lock_key, "locked")
        if not acquired:
            raise ValueError("Duplicate upload detected. Please wait.")
        await self.redis.expire(lock_key, 60)

        await self.pdf_import_queue.check_job_existing(pdf_bytes, user_id)

        # 3. Save decoded file to temp_dir/pdf_uploads/{job_id}.pdf
        job_id = uuid.uuid4()
        upload_dir = "/tmp/pdf_uploads"
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, f"{job_id}.pdf")
        
        with open(file_path, "wb") as f:
            f.write(pdf_bytes)

        # 4. Create Session in DB
        lid = uuid.UUID(lesson_id) if lesson_id else None
        session = ImportSessionEntity(
            id=job_id,
            user_id=user_id,
            target_scope=target_scope,
            lesson_id=lid,
            status=ImportSessionStatus.PROCESSING,
            file_name=file_name,
            created_at=datetime.utcnow()
        )
        await self.import_session_repo.create(session)

        # 5. Enqueue background task
        await self.pdf_import_queue.enqueue_parse_pdf(
            job_id=job_id,
            file_path=file_path,
            user_id=user_id,
            lesson_id=lesson_id,
            target_scope=target_scope,
            password=password
        )

        return StartPdfImportResponse(
            job_id=job_id,
            status="ACCEPTED",
            message="PDF upload accepted. Processing started in background."
        )
