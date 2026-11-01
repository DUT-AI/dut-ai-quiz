from uuid import UUID

from app.domain.interfaces import ILessonRepository, IQuestionRepository
from app.presentation.schemas.lessons import LessonDeleteAction


class DeleteLessonUseCase:
    """Delete a lesson from the system with options to relocate, unassign, or delete questions."""

    def __init__(
        self,
        repo: ILessonRepository,
        question_repo: IQuestionRepository,
    ) -> None:
        self._repo = repo
        self._question_repo = question_repo

    async def execute(
        self,
        lesson_id: str,
        action: LessonDeleteAction = LessonDeleteAction.UNASSIGN,
        reassign_to_lesson_id: str | None = None,
    ) -> bool:
        """Execute the use case to delete the lesson."""
        source_id = UUID(lesson_id)
        entity = await self._repo.get(source_id)
        if not entity:
            return False

        if action == LessonDeleteAction.REASSIGN:
            if not reassign_to_lesson_id:
                raise ValueError("Vui lòng chọn bài học đích để chuyển câu hỏi sang.")
            target_id = UUID(reassign_to_lesson_id)
            if target_id == source_id:
                raise ValueError("Bài học đích phải khác bài học cần xóa.")
            target_entity = await self._repo.get(target_id)
            if not target_entity:
                raise ValueError("Bài học đích không tồn tại.")
            await self._question_repo.reassign_lesson(source_id, target_id)

        elif action == LessonDeleteAction.UNASSIGN:
            await self._question_repo.reassign_lesson(source_id, None)

        elif action == LessonDeleteAction.DELETE:
            questions = await self._question_repo.list_all(
                lesson_id=source_id, limit=5000
            )
            question_ids = [q.id for q in questions]
            if question_ids:
                in_exams = await self._question_repo.check_questions_in_exams(
                    question_ids
                )
                if in_exams:
                    raise ValueError(
                        "Không thể xóa các câu hỏi thuộc bài học này vì đã được sử dụng trong đề thi. "
                        "Vui lòng chọn 'Chuyển bài học' hoặc 'Gỡ liên kết' để bảo toàn dữ liệu đề thi."
                    )
                await self._question_repo.delete_bulk(question_ids)

        await self._repo.delete(entity)
        return True
