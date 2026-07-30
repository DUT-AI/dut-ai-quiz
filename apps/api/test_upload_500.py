import asyncio
import os
import uuid
import fitz
from app.config import settings
from redis.asyncio import Redis
from app.infrastructure.repositories.import_sessions import ImportSessionRepository
from app.infrastructure.clients.arq_pdf_import_queue import ArqPdfImportQueue
from app.application.use_cases.questions.start_pdf_import_uc import StartPdfImportUseCase
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession

async def main():
    redis = Redis.from_url(settings.redis_url, decode_responses=True)
    engine = create_async_engine(settings.database_url)
    async with AsyncSession(engine) as db_session:
        repo = ImportSessionRepository(db_session)
        queue = ArqPdfImportQueue(redis)
        use_case = StartPdfImportUseCase(import_session_repo=repo, pdf_import_queue=queue, redis=redis)
        
        doc = fitz.open()
        doc.new_page()
        pdf_bytes = doc.write()
        doc.close()
        
        try:
            response = await use_case.execute(
                user_id=1,
                pdf_bytes=pdf_bytes,
                target_scope=None,
                password=None
            )
            print("Success:", response)
        except Exception as e:
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
