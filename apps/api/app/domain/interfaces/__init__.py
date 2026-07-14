from app.domain.value_objects.submission import SubmissionStorageInfo

from .attempt_repo import IAttemptAnswerRepository, IAttemptRepository
from .blog_cache import IBlogCache
from .exam_question_repo import IExamQuestionRepository
from .exam_repo import IExamRepository
from .focus_event_repo import IFocusEventRepository
from .hackathon_event_subscriber import IHackathonEventSubscriber
from .hackathon_leaderboard_cache import IHackathonLeaderboardCache
from .hackathon_repo import (
    IHackathonRegistrationRepository,
    IHackathonRepository,
    IHackathonSubmissionRepository,
    IHackathonTaskRepository,
    IHackathonTeamRepository,
)
from .hackathon_submission_store import IHackathonSubmissionStore
from .lesson_repo import ILessonRepository
from .module_repo import IModuleRepository
from .manage_cache import IDUTAIManageCache
from .manage_service import IManageService
from .game_session_repo import IGameSessionRepository
from .question_repo import IQuestionRepository
from .tag_repo import ITagRepository
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
    "IModuleRepository",
    "IGameSessionRepository",
    "IQuestionRepository",
    "ITagRepository",
    "IUserRepository",
    "IManageService",
    "IDUTAIManageCache",
    "IHackathonLeaderboardCache",
    "IHackathonEventSubscriber",
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

