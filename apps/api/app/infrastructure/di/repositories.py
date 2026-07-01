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


class RepositoryProvider(Provider):
    scope = Scope.REQUEST

    lesson_repo = provide(LessonRepository, provides=ILessonRepository)
    user_repo = provide(UserRepository, provides=IUserRepository)
    question_repo = provide(QuestionRepository, provides=IQuestionRepository)
    exam_repo = provide(ExamRepository, provides=IExamRepository)
    exam_question_repo = provide(ExamQuestionRepository, provides=IExamQuestionRepository)
    focus_event_repo = provide(FocusEventRepository, provides=IFocusEventRepository)
    practice_session_repo = provide(PracticeSessionRepository, provides=IPracticeSessionRepository)
    attempt_repo = provide(AttemptRepository, provides=IAttemptRepository)
