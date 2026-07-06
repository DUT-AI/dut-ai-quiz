from app.domain.value_objects.submission import SubmissionStorageInfo

from .attempt_repo import IAttemptAnswerRepository, IAttemptRepository
from .blog_cache import IBlogCache
from .exam_question_repo import IExamQuestionRepository
from .exam_repo import IExamRepository
from .focus_event_repo import IFocusEventRepository
from .hackathon_repo import (
    IHackathonRegistrationRepository,
    IHackathonRepository,
    IHackathonSubmissionRepository,
    IHackathonTaskRepository,
    IHackathonTeamRepository,
)
from .hackathon_submission_store import IHackathonSubmissionStore
from .lesson_repo import ILessonRepository
from .manage_cache import IDUTAIManageCache
from .manage_service import IManageService
from .practice_session_repo import IPracticeSessionRepository
from .question_repo import IQuestionRepository
from .s3_client import IS3Client
from .submission_queue import ISubmissionQueue
from .user_repo import IUserRepository

__all__ = [
    "IAttemptAnswerRepository",
    "IAttemptRepository",
    "IBlogCache",
    "IExamQuestionRepository",
    "IExamRepository",
    "IFocusEventRepository",
    "ILessonRepository",
    "IPracticeSessionRepository",
    "IQuestionRepository",
    "IUserRepository",
    "IManageService",
    "IDUTAIManageCache",
    "IHackathonRepository",
    "IHackathonTaskRepository",
    "IHackathonTeamRepository",
    "IHackathonRegistrationRepository",
    "IHackathonSubmissionRepository",
    "IS3Client",
    "IHackathonSubmissionStore",
    "SubmissionStorageInfo",
    "ISubmissionQueue",
]
