from dishka import Provider, Scope, provide

from app.domain.interfaces import (
    IAttemptRepository,
    IExamQuestionRepository,
    IExamRepository,
    IFocusEventRepository,
    ILessonRepository,
    IPracticeSessionRepository,
    IQuestionRepository,
    IUserRepository,
)
from app.infrastructure.repositories.attempts import AttemptRepository
from app.infrastructure.repositories.exam_questions import ExamQuestionRepository
from app.infrastructure.repositories.exams import ExamRepository
from app.infrastructure.repositories.focus_events import FocusEventRepository
from app.infrastructure.repositories.lessons import LessonRepository
from app.infrastructure.repositories.practice_sessions import PracticeSessionRepository
from app.infrastructure.repositories.questions import QuestionRepository
from app.infrastructure.repositories.users import UserRepository
from app.infrastructure.repositories.hackathons import HackathonRepository
from app.infrastructure.repositories.hackathons import HackathonTaskRepository


class RepositoryProvider(Provider):
    scope = Scope.REQUEST

    # Đăng ký kèm theo tham số provides để map concrete class với interface của nó
    lesson_repo = provide(LessonRepository, provides=ILessonRepository)
    user_repo = provide(UserRepository, provides=IUserRepository)
    exam_repo = provide(ExamRepository, provides=IExamRepository)
    exam_question_repo = provide(
        ExamQuestionRepository, provides=IExamQuestionRepository
    )
    question_repo = provide(QuestionRepository, provides=IQuestionRepository)
    focus_event_repo = provide(FocusEventRepository, provides=IFocusEventRepository)
    practice_session_repo = provide(
        PracticeSessionRepository, provides=IPracticeSessionRepository
    )
    attempt_repo = provide(AttemptRepository, provides=IAttemptRepository)

    # Riêng hackathon_repo không dùng interface thì giữ nguyên
    hackathon_repo = provide(HackathonRepository)
    hackathon_task_repo = provide(HackathonTaskRepository)
