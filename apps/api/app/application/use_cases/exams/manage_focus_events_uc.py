from uuid import UUID

from app.domain.exceptions import ForbiddenException, NotFoundException
from app.domain.interfaces import (
    IAttemptRepository,
    IExamRepository,
    IFocusEventRepository,
)


class DeleteFocusEventUseCase:
    """Use case for educator to delete a single focus violation event and decrement tab_out_count."""

    def __init__(
        self,
        exam_repo: IExamRepository,
        att_repo: IAttemptRepository,
        fe_repo: IFocusEventRepository,
    ) -> None:
        self._exam_repo = exam_repo
        self._att_repo = att_repo
        self._fe_repo = fe_repo

    async def execute(
        self,
        exam_id: UUID,
        attempt_id: UUID,
        event_id: UUID,
        user_id: int,
        user_role: str = "educator",
    ) -> dict:
        exam = await self._exam_repo.get(exam_id)
        if not exam:
            raise NotFoundException("Exam not found")

        is_admin = user_role.lower() in ("admin", "sub_admin")
        if not is_admin and exam.created_by != user_id:
            raise ForbiddenException("Only exam creator or admin can manage violations")

        att = await self._att_repo.get(attempt_id)
        if not att or att.exam_id != exam_id:
            raise NotFoundException("Attempt not found for this exam")

        deleted = await self._fe_repo.delete(event_id)
        if not deleted:
            raise NotFoundException("Focus event not found")

        # Decrement tab_out_count by 1 (minimum 0)
        att.tab_out_count = max(0, att.tab_out_count - 1)
        await self._att_repo.save(att)

        return {
            "success": True,
            "attempt_id": str(att.id),
            "tab_out_count": att.tab_out_count,
        }


class ClearAttemptFocusEventsUseCase:
    """Use case for educator to clear all focus violation events for an attempt and reset tab_out_count to 0."""

    def __init__(
        self,
        exam_repo: IExamRepository,
        att_repo: IAttemptRepository,
        fe_repo: IFocusEventRepository,
    ) -> None:
        self._exam_repo = exam_repo
        self._att_repo = att_repo
        self._fe_repo = fe_repo

    async def execute(
        self,
        exam_id: UUID,
        attempt_id: UUID,
        user_id: int,
        user_roles: set[str],
    ) -> dict:
        exam = await self._exam_repo.get(exam_id)
        if not exam:
            raise NotFoundException("Exam not found")

        is_admin = user_roles & set("admin")
        if not is_admin and exam.created_by != user_id:
            raise ForbiddenException("Only exam creator or admin can manage violations")

        att = await self._att_repo.get(attempt_id)
        if not att or att.exam_id != exam_id:
            raise NotFoundException("Attempt not found for this exam")

        deleted_count = await self._fe_repo.delete_for_attempt(attempt_id)

        # Reset tab_out_count to 0
        att.tab_out_count = 0
        await self._att_repo.save(att)

        return {
            "success": True,
            "attempt_id": str(att.id),
            "deleted_count": deleted_count,
            "tab_out_count": 0,
        }
