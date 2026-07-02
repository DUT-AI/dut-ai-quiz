from dishka import Provider, Scope, provide

from app.infrastructure.repositories.exams import ExamRepository
from app.infrastructure.repositories.exam_questions import ExamQuestionRepository
from app.infrastructure.repositories.questions import QuestionRepository
from app.infrastructure.repositories.focus_events import FocusEventRepository
from app.infrastructure.repositories.practice_sessions import PracticeSessionRepository
from app.infrastructure.repositories.attempts import AttemptRepository
from app.infrastructure.repositories.lessons import SqlLessonRepository, LessonRepository
from app.infrastructure.repositories.users import UserRepository
from app.infrastructure.repositories.hackathons import HackathonRepository


class RepositoryProvider(Provider):
    scope = Scope.REQUEST

    # LessonRepository is a Protocol, so we provide the SQL implementation
    lesson_repo = provide(SqlLessonRepository, provides=LessonRepository)

    # These are currently concrete classes in your implementation
    user_repo = provide(UserRepository)
    exam_repo = provide(ExamRepository)
    exam_question_repo = provide(ExamQuestionRepository)
    question_repo = provide(QuestionRepository)
    focus_event_repo = provide(FocusEventRepository)
    practice_session_repo = provide(PracticeSessionRepository)
    attempt_repo = provide(AttemptRepository)
    hackathon_repo = provide(HackathonRepository)
