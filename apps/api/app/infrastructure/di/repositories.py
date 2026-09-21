from dishka import Provider, Scope, provide

from app.domain.interfaces import (
    IAttemptRepository,
    ICommentReactionRepository,
    ICommentRepository,
    IExamQuestionRepository,
    IExamRepository,
    IFocusEventRepository,
    IGameSessionRepository,
    IHomeworkRepository,
    IImportSessionRepository,
    ILessonChunkRepository,
    ILessonRepository,
    IModuleRepository,
    IQuestionRepository,
    ITagRepository,
    IUserRepository,
)
from app.domain.interfaces.hackathon_repo import (
    IHackathonRegistrationRepository,
    IHackathonRepository,
    IHackathonSubmissionRepository,
    IHackathonTaskRepository,
    IHackathonTeamRepository,
)
from app.domain.interfaces.import_session_repo import IImportSessionRepository
from app.infrastructure.repositories.attempts import AttemptRepository
from app.infrastructure.repositories.comment_reactions import CommentReactionRepository
from app.infrastructure.repositories.comments import CommentRepository
from app.infrastructure.repositories.exam_questions import ExamQuestionRepository
from app.infrastructure.repositories.exams import ExamRepository
from app.infrastructure.repositories.focus_events import FocusEventRepository
from app.infrastructure.repositories.game_sessions import GameSessionRepository
from app.infrastructure.repositories.hackathons import (
    HackathonRegistrationRepository,
    HackathonRepository,
    HackathonSubmissionRepository,
    HackathonTaskRepository,
    HackathonTeamRepository,
)
from app.infrastructure.repositories.homeworks import HomeworkRepository
from app.infrastructure.repositories.import_sessions import ImportSessionRepository
from app.infrastructure.repositories.lesson_chunks import LessonChunkRepository
from app.infrastructure.repositories.lessons import LessonRepository
from app.infrastructure.repositories.modules import ModuleRepository
from app.infrastructure.repositories.questions import QuestionRepository
from app.infrastructure.repositories.tags import TagRepository
from app.infrastructure.repositories.users import UserRepository


class RepositoryProvider(Provider):
    scope = Scope.REQUEST

    # Đăng ký kèm theo tham số provides để map concrete class với interface của nó
    lesson_repo = provide(LessonRepository, provides=ILessonRepository)
    lesson_chunk_repo = provide(
        LessonChunkRepository, provides=ILessonChunkRepository
    )
    module_repo = provide(ModuleRepository, provides=IModuleRepository)
    user_repo = provide(UserRepository, provides=IUserRepository)
    exam_repo = provide(ExamRepository, provides=IExamRepository)
    exam_question_repo = provide(
        ExamQuestionRepository, provides=IExamQuestionRepository
    )
    question_repo = provide(QuestionRepository, provides=IQuestionRepository)
    tag_repo = provide(TagRepository, provides=ITagRepository)
    focus_event_repo = provide(FocusEventRepository, provides=IFocusEventRepository)
    game_session_repo = provide(
        GameSessionRepository, provides=IGameSessionRepository
    )
    attempt_repo = provide(AttemptRepository, provides=IAttemptRepository)
    hackathon_repo = provide(HackathonRepository, provides=IHackathonRepository)
    hackathon_task_repo = provide(
        HackathonTaskRepository, provides=IHackathonTaskRepository
    )
    hackathon_team_repo = provide(
        HackathonTeamRepository, provides=IHackathonTeamRepository
    )
    hackathon_registration_repo = provide(
        HackathonRegistrationRepository, provides=IHackathonRegistrationRepository
    )
    hackathon_submission_repo = provide(
        HackathonSubmissionRepository, provides=IHackathonSubmissionRepository
    )
    comment_repo = provide(CommentRepository, provides=ICommentRepository)
    comment_reaction_repo = provide(CommentReactionRepository, provides=ICommentReactionRepository)
    import_session_repo = provide(ImportSessionRepository, provides=IImportSessionRepository)
    homework_repo = provide(HomeworkRepository, provides=IHomeworkRepository)
