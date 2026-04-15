from datetime import datetime

from app.infrastructure.repositories.exams import ExamRepository


async def execute_for_teacher(session, user_id: int):
    repo = ExamRepository(session)
    return await repo.list_for_teacher(user_id)


async def execute_for_student(session, now: datetime):
    repo = ExamRepository(session)
    return await repo.list_published_for_student(now)
