from uuid import UUID

from app.domain.interfaces import IAttemptRepository, IExamRepository
from app.presentation.schemas.exam_attempts import DeleteAttemptResponse
from fastapi import HTTPException
from loguru import logger


class DeleteExamAttemptUseCase:
    def __init__(
        self,
        exam_repo: IExamRepository,
        attempt_repo: IAttemptRepository,
    ):
        self._exam_repo = exam_repo
        self._attempt_repo = attempt_repo

    async def execute(
        self,
        exam_id: UUID,
        attempt_id: UUID,
        operator_user_id: int,
        operator_role: str = "educator",
    ) -> DeleteAttemptResponse:
        exam = await self._exam_repo.get(exam_id)
        if not exam:
            raise HTTPException(status_code=404, detail="Exam not found")

        attempt = await self._attempt_repo.get(attempt_id)
        if not attempt or attempt.exam_id != exam_id:
            raise HTTPException(
                status_code=404, detail="Attempt not found for this exam"
            )

        # RBAC Check: Admin, Educator, or Exam Creator
        is_creator = exam.created_by == operator_user_id
        is_admin_or_educator = operator_role in ["admin", "educator", "teacher"]
        if not (is_creator or is_admin_or_educator):
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to delete attempts for this exam",
            )

        deleted = await self._attempt_repo.delete_attempt(attempt_id)
        if not deleted:
            raise HTTPException(
                status_code=404,
                detail="Attempt could not be deleted or already removed",
            )

        logger.info(
            f"AUDIT: Attempt {attempt_id} for user {attempt.user_id} in exam {exam_id} deleted by educator {operator_user_id} ({operator_role})"
        )

        return DeleteAttemptResponse(
            success=True,
            message="Attempt deleted successfully",
            deleted_attempt_id=attempt_id,
        )
