from dishka import Provider, Scope, provide

from app.infrastructure.repositories.exams import ExamRepository
from app.infrastructure.repositories.exam_questions import ExamQuestionRepository
from app.infrastructure.repositories.questions import QuestionRepository
from app.infrastructure.repositories.focus_events import FocusEventRepository
from app.infrastructure.repositories.practice_sessions import PracticeSessionRepository
from app.infrastructure.repositories.attempts import AttemptRepository

class RepositoryProvider(Provider):
    exam_repo = provide(ExamRepository, scope=Scope.REQUEST)
    exam_question_repo = provide(ExamQuestionRepository, scope=Scope.REQUEST)
    question_repo = provide(QuestionRepository, scope=Scope.REQUEST)
    focus_event_repo = provide(FocusEventRepository, scope=Scope.REQUEST)
    practice_session_repo = provide(PracticeSessionRepository, scope=Scope.REQUEST)
    attempt_repo = provide(AttemptRepository, scope=Scope.REQUEST)
