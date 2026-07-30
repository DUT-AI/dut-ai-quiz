import os
import uuid
from uuid import UUID
from loguru import logger

from app.domain.entities.import_session import ImportSessionStatus
from app.domain.interfaces.import_session_repo import IImportSessionRepository
from app.domain.interfaces.pdf_parser_strategy import IPdfParserStrategy
from app.domain.interfaces.question_repo import IQuestionRepository
from app.domain.entities.question import QuestionEntity, QuestionStatus, DuplicateStatus, QuestionOptionEntity
from app.domain.value_objects import Difficulty, PoolType
from app.core.datetime_utils import now_ict

class ProcessPdfImportUseCase:
    def __init__(
        self,
        import_session_repo: IImportSessionRepository,
        question_repo: IQuestionRepository,
        pdf_parser: IPdfParserStrategy,
        # duplicate_checker: IDuplicateChecker
    ):
        self.import_session_repo = import_session_repo
        self.question_repo = question_repo
        self.pdf_parser = pdf_parser

    async def execute(self, job_id: UUID, file_path: str, user_id: int, target_scope: str | None, password: str | None) -> None:
        session = await self.import_session_repo.get_by_id(job_id)
        if not session or session.status != ImportSessionStatus.PROCESSING:
            logger.warning(f"Session {job_id} not found or not in PROCESSING state.")
            return

        try:
            # 1. Read file bytes
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"PDF file not found at {file_path}")
            
            with open(file_path, "rb") as f:
                pdf_bytes = f.read()

            # 2. Parse using AI Strategy (STEP 3 & STEP 5 & STEP 4)
            # The parser will handle opendataloader, gemini, minio upload, etc.
            parsed_questions = await self.pdf_parser.parse(
                pdf_bytes=pdf_bytes, 
                password=password, 
                user_id=user_id,
                job_id=job_id
            )

            # 3. Create Draft Questions in DB (STEP 6)
            entities_to_add = []
            for pq in parsed_questions:
                # TODO: Implement Duplicate Check via Cosine Similarity here
                
                # For now, just save as DRAFT
                q_entity = QuestionEntity(
                    id=uuid.uuid4(),
                    pool_type=PoolType.PRACTICE, # or specific pool
                    difficulty=Difficulty.MEDIUM, # from AI
                    content=pq.content,
                    options=[
                        QuestionOptionEntity(
                            id=opt.id,
                            text=opt.text,
                            is_correct=opt.is_correct,
                            fixed=opt.fixed
                        ) for opt in pq.options
                    ],
                    solution=pq.solution,
                    lesson_id=None, # from AI suggested lesson_id
                    tags=[], # from AI
                    created_by=user_id,
                    created_at=now_ict(),
                    status=QuestionStatus.DRAFT,
                    is_difficulty_ai_suggested=True,
                    is_answer_ai_generated=False,
                    is_solution_ai_generated=False,
                    import_session_id=job_id
                )
                entities_to_add.append(q_entity)
            
            if entities_to_add:
                await self.question_repo.add_bulk(entities_to_add)
            
            # 4. Mark session as COMPLETED
            session.status = ImportSessionStatus.COMPLETED
            session.total_questions = len(entities_to_add)
            session.processed_questions = len(entities_to_add)
            await self.import_session_repo.update(session)
            
        except Exception as e:
            logger.error(f"Failed to process PDF import for job {job_id}: {e}")
            session.status = ImportSessionStatus.FAILED
            session.error_message = str(e)
            await self.import_session_repo.update(session)
        finally:
            # Clean up the temp file
            if os.path.exists(file_path):
                os.remove(file_path)
