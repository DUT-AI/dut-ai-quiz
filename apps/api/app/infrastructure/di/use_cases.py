from dishka import Provider, Scope, provide
from redis.asyncio import Redis

from app.application.services.pdf_ai_parser import PDFAIParserService
from app.application.services.pdf_parser import PDFParserService
from app.application.services.lesson_chunker import LessonChunker
from app.application.services.lesson_embedding_indexer import LessonEmbeddingIndexer
from app.application.services.lesson_index_scheduler import LessonIndexScheduler
from app.application.services.question_embedding import QuestionEmbeddingService
from app.config import settings
from app.application.services.user_service import UserService
from app.application.use_cases.attempts import (
    GetAttemptDetailUseCase,
    GetAttemptUseCase,
    ListExamAttemptsUseCase,
    ListUserAttemptsUseCase,
    PatchAttemptAnswersUseCase,
    RecordFocusEventUseCase,
    ReviewAttemptUseCase,
    StartAttemptUseCase,
    SubmitAttemptUseCase,
)
from app.application.use_cases.attempts.rescore_use_case import RescoreAttemptUseCase
from app.application.use_cases.auth import (
    GoogleAuthUseCase,
    LoginByManageAccountUseCase,
    LogoutUseCase,
)
from app.application.use_cases.exams.exam_use_case import (
    CreateExamUseCase,
    DeleteExamUseCase,
    GetExamUseCase,
    ListExamQuestionsUseCase,
    ListExamsUseCase,
    SetExamQuestionsUseCase,
    UpdateExamUseCase,
)
from app.application.use_cases.exams.stats_use_case import GetExamStatsUseCase
from app.application.use_cases.hackathon import (
    CancelRegistrationUseCase,
    CreateHackathonTaskUseCase,
    CreateHackathonUseCase,
    CreateTeamUseCase,
    DeleteHackathonTaskUseCase,
    DeleteHackathonUseCase,
    GetHackathonTaskUseCase,
    GetHackathonUseCase,
    GetRegistrationStatusUseCase,
    JoinTeamUseCase,
    LeaveTeamUseCase,
    ListHackathonsUseCase,
    ListHackathonTasksUseCase,
    ListRegistrationsUseCase,
    RegisterIndividualUseCase,
    ReviewRegistrationUseCase,
    UpdateHackathonTaskUseCase,
    UpdateHackathonUseCase,
)
from app.application.use_cases.hackathon.submissions import (
    CancelSubmissionUseCase,
    GetSubmissionLogsUseCase,
    ListSubmissionsUseCase,
    SubmitTaskUseCase,
    PresignSubmitUseCase,
    ViewHackathonLeaderboardUseCase,
)
from app.application.services.hackathon_leaderboard import HackathonLeaderboardAppService
from app.domain.services.hackathon_leaderboard import HackathonLeaderboardDomainService
from app.application.use_cases.leaderboard.leaderboard_use_case import (
    GetLeaderboardUseCase,
)
from app.application.use_cases.lessons.create_lesson_uc import CreateLessonUseCase
from app.application.use_cases.lessons.delete_lesson_uc import DeleteLessonUseCase
from app.application.use_cases.lessons.get_lesson_detail_uc import (
    GetLessonDetailUseCase,
)
from app.application.use_cases.lessons.get_lesson_by_slug_uc import (
    GetLessonBySlugUseCase,
)
from app.application.use_cases.lessons.list_lessons_uc import ListLessonsUseCase
from app.application.use_cases.lessons.reorder_lessons_uc import (
    ReorderLessonsUseCase,
)
from app.application.use_cases.lessons.update_lesson_uc import UpdateLessonUseCase
from app.application.use_cases.lessons.index_lesson_uc import IndexLessonUseCase
from app.application.use_cases.modules import (
    CreateModuleUseCase,
    DeleteModuleUseCase,
    ListModulesUseCase,
    UpdateModuleUseCase,
    ReorderModulesUseCase,
)
from app.application.use_cases.me.me_use_case import GetProfileUseCase
from app.application.use_cases.game import (
    FinishGameSessionUseCase,
    GetActiveGameSessionUseCase,
    GetGameHistorySummaryUseCase,
    GetGameLeaderboardUseCase,
    GetGameSessionUseCase,
    ListGameHistoryUseCase,
    PatchGameAnswerUseCase,
    StartGameSessionUseCase,
    UseItemGameUseCase,
)
from app.application.use_cases.questions import (
    BulkCreateQuestionsUseCase,
    CreateQuestionUseCase,
    DeleteQuestionUseCase,
    GetQuestionUseCase,
    ListQuestionsUseCase,
    UpdateQuestionUseCase,
    AnswerQuestionUseCase,
    GetRelatedLessonsUseCase,
    FindRelatedQuestionsUseCase,
)
from app.application.use_cases.tags.tags_use_case import (
    ListTagsUseCase,
    CreateTagUseCase,
    DeleteTagUseCase,
)
from app.application.use_cases.comment import (
    CreateCommentUseCase,
    GetCommentsUseCase,
    ToggleReactionUseCase,
    DeleteCommentUseCase,
)
from app.application.use_cases.pdf_import import (
    StartImportUseCase,
    GetImportStatusUseCase,
    ReviewDraftQuestionsUseCase,
    ApproveQuestionUseCase,
    RejectQuestionUseCase,
    RegenerateSolutionUseCase,
    AcquireLockUseCase,
    HeartbeatLockUseCase,
)
from app.application.use_cases.uploads.presign_upload import PresignUploadUseCase
from app.application.use_cases.homeworks import (
    ArchiveHomeworkUseCase,
    CreateHomeworkUseCase,
    GetHomeworkAttachmentUrlUseCase,
    GetHomeworkSubmissionDownloadUrlUseCase,
    GetMyHomeworkSubmissionUseCase,
    ListHomeworksUseCase,
    ListHomeworkSubmissionsUseCase,
    ListMyHomeworksUseCase,
    ListUnsubmittedHomeworkUsersUseCase,
    SubmitHomeworkUseCase,
    UpdateHomeworkUseCase,
)
from app.domain.events.bus import EventBus
from app.domain.interfaces import (
    IAttemptRepository,
    IFocusEventRepository,
    IManageService,
    IUserRepository,
    IS3Client,
    IImportSessionRepository,
    IQuestionRepository,
)
from app.infrastructure.cache.redis_client import ProfileCache
from sqlalchemy.ext.asyncio import AsyncSession


class UseCaseProvider(Provider):
    create_exam_use_case = provide(CreateExamUseCase, scope=Scope.REQUEST)
    delete_exam_use_case = provide(DeleteExamUseCase, scope=Scope.REQUEST)
    get_exam_use_case = provide(GetExamUseCase, scope=Scope.REQUEST)
    list_exam_questions_use_case = provide(
        ListExamQuestionsUseCase, scope=Scope.REQUEST
    )
    list_exams_use_case = provide(ListExamsUseCase, scope=Scope.REQUEST)
    set_exam_questions_use_case = provide(SetExamQuestionsUseCase, scope=Scope.REQUEST)
    update_exam_use_case = provide(UpdateExamUseCase, scope=Scope.REQUEST)
    get_exam_stats_use_case = provide(GetExamStatsUseCase, scope=Scope.REQUEST)
    create_hackathon_use_case = provide(CreateHackathonUseCase, scope=Scope.REQUEST)
    delete_hackathon_use_case = provide(DeleteHackathonUseCase, scope=Scope.REQUEST)
    get_hackathon_use_case = provide(GetHackathonUseCase, scope=Scope.REQUEST)
    list_hackathons_use_case = provide(ListHackathonsUseCase, scope=Scope.REQUEST)
    update_hackathon_use_case = provide(UpdateHackathonUseCase, scope=Scope.REQUEST)
    create_hackathon_task_use_case = provide(
        CreateHackathonTaskUseCase, scope=Scope.REQUEST
    )
    delete_hackathon_task_use_case = provide(
        DeleteHackathonTaskUseCase, scope=Scope.REQUEST
    )
    get_hackathon_task_use_case = provide(GetHackathonTaskUseCase, scope=Scope.REQUEST)
    list_hackathon_tasks_use_case = provide(
        ListHackathonTasksUseCase, scope=Scope.REQUEST
    )
    update_hackathon_task_use_case = provide(
        UpdateHackathonTaskUseCase, scope=Scope.REQUEST
    )
    register_individual_use_case = provide(
        RegisterIndividualUseCase, scope=Scope.REQUEST
    )

    create_team_use_case = provide(CreateTeamUseCase, scope=Scope.REQUEST)
    join_team_use_case = provide(JoinTeamUseCase, scope=Scope.REQUEST)
    leave_team_use_case = provide(LeaveTeamUseCase, scope=Scope.REQUEST)
    cancel_registration_use_case = provide(
        CancelRegistrationUseCase, scope=Scope.REQUEST
    )
    list_registrations_use_case = provide(ListRegistrationsUseCase, scope=Scope.REQUEST)
    review_registration_use_case = provide(
        ReviewRegistrationUseCase, scope=Scope.REQUEST
    )
    get_registration_status_use_case = provide(
        GetRegistrationStatusUseCase, scope=Scope.REQUEST
    )

    # hackathon submissions
    submit_task_use_case = provide(SubmitTaskUseCase, scope=Scope.REQUEST)
    presign_submit_use_case = provide(PresignSubmitUseCase, scope=Scope.REQUEST)
    cancel_submission_use_case = provide(CancelSubmissionUseCase, scope=Scope.REQUEST)
    get_submission_logs_use_case = provide(
        GetSubmissionLogsUseCase, scope=Scope.REQUEST
    )
    hackathon_leaderboard_app_service = provide(
        HackathonLeaderboardAppService, scope=Scope.REQUEST
    )
    hackathon_leaderboard_domain_service = provide(
        HackathonLeaderboardDomainService, scope=Scope.REQUEST
    )
    view_hackathon_leaderboard_use_case = provide(
        ViewHackathonLeaderboardUseCase, scope=Scope.REQUEST
    )
    list_submissions_use_case = provide(ListSubmissionsUseCase, scope=Scope.REQUEST)
    presign_upload_use_case = provide(PresignUploadUseCase, scope=Scope.REQUEST)
    list_my_homeworks_use_case = provide(
        ListMyHomeworksUseCase,
        scope=Scope.REQUEST,
    )
    list_homeworks_use_case = provide(
        ListHomeworksUseCase,
        scope=Scope.REQUEST,
    )
    create_homework_use_case = provide(
        CreateHomeworkUseCase,
        scope=Scope.REQUEST,
    )
    update_homework_use_case = provide(
        UpdateHomeworkUseCase,
        scope=Scope.REQUEST,
    )
    archive_homework_use_case = provide(
        ArchiveHomeworkUseCase,
        scope=Scope.REQUEST,
    )
    submit_homework_use_case = provide(
        SubmitHomeworkUseCase,
        scope=Scope.REQUEST,
    )
    get_my_homework_submission_use_case = provide(
        GetMyHomeworkSubmissionUseCase,
        scope=Scope.REQUEST,
    )
    list_homework_submissions_use_case = provide(
        ListHomeworkSubmissionsUseCase,
        scope=Scope.REQUEST,
    )
    list_unsubmitted_homework_users_use_case = provide(
        ListUnsubmittedHomeworkUsersUseCase,
        scope=Scope.REQUEST,
    )
    get_homework_attachment_url_use_case = provide(
        GetHomeworkAttachmentUrlUseCase,
        scope=Scope.REQUEST,
    )
    get_homework_submission_download_url_use_case = provide(
        GetHomeworkSubmissionDownloadUrlUseCase,
        scope=Scope.REQUEST,
    )

    # questions
    create_question_use_case = provide(CreateQuestionUseCase, scope=Scope.REQUEST)
    delete_question_use_case = provide(DeleteQuestionUseCase, scope=Scope.REQUEST)
    get_question_use_case = provide(GetQuestionUseCase, scope=Scope.REQUEST)
    list_questions_use_case = provide(ListQuestionsUseCase, scope=Scope.REQUEST)
    update_question_use_case = provide(UpdateQuestionUseCase, scope=Scope.REQUEST)
    bulk_create_questions_use_case = provide(
        BulkCreateQuestionsUseCase, scope=Scope.REQUEST
    )
    answer_question_use_case = provide(AnswerQuestionUseCase, scope=Scope.REQUEST)
    get_related_lessons_use_case = provide(
        GetRelatedLessonsUseCase, scope=Scope.REQUEST
    )
    find_related_questions_use_case = provide(
        FindRelatedQuestionsUseCase, scope=Scope.REQUEST
    )

    # tags
    list_tags_use_case = provide(ListTagsUseCase, scope=Scope.REQUEST)
    create_tag_use_case = provide(CreateTagUseCase, scope=Scope.REQUEST)
    delete_tag_use_case = provide(DeleteTagUseCase, scope=Scope.REQUEST)

    # attempts
    start_attempt_use_case = provide(StartAttemptUseCase, scope=Scope.REQUEST)
    submit_attempt_use_case = provide(SubmitAttemptUseCase, scope=Scope.REQUEST)
    get_attempt_use_case = provide(GetAttemptUseCase, scope=Scope.REQUEST)
    get_attempt_detail_use_case = provide(GetAttemptDetailUseCase, scope=Scope.REQUEST)
    list_exam_attempts_use_case = provide(ListExamAttemptsUseCase, scope=Scope.REQUEST)
    patch_attempt_answers_use_case = provide(
        PatchAttemptAnswersUseCase, scope=Scope.REQUEST
    )
    list_user_attempts_use_case = provide(ListUserAttemptsUseCase, scope=Scope.REQUEST)
    review_attempt_use_case = provide(ReviewAttemptUseCase, scope=Scope.REQUEST)
    rescore_attempt_use_case = provide(RescoreAttemptUseCase, scope=Scope.REQUEST)

    @provide(scope=Scope.REQUEST)
    def record_focus_event_use_case(
        self,
        attempt_repo: IAttemptRepository,
        focus_repo: IFocusEventRepository,
        bus: EventBus,
    ) -> RecordFocusEventUseCase:
        return RecordFocusEventUseCase(attempt_repo, focus_repo, bus)

    # leaderboard
    get_leaderboard_use_case = provide(GetLeaderboardUseCase, scope=Scope.REQUEST)

    # game
    start_game_session_use_case = provide(
        StartGameSessionUseCase, scope=Scope.REQUEST
    )
    use_item_game_use_case = provide(UseItemGameUseCase, scope=Scope.REQUEST)
    patch_game_answer_use_case = provide(
        PatchGameAnswerUseCase, scope=Scope.REQUEST
    )
    get_game_session_use_case = provide(
        GetGameSessionUseCase, scope=Scope.REQUEST
    )
    finish_game_session_use_case = provide(
        FinishGameSessionUseCase, scope=Scope.REQUEST
    )
    get_active_game_session_use_case = provide(
        GetActiveGameSessionUseCase, scope=Scope.REQUEST
    )
    list_game_history_use_case = provide(
        ListGameHistoryUseCase, scope=Scope.REQUEST
    )
    get_game_history_summary_use_case = provide(
        GetGameHistorySummaryUseCase, scope=Scope.REQUEST
    )
    get_game_leaderboard_use_case = provide(
        GetGameLeaderboardUseCase, scope=Scope.REQUEST
    )

    list_lessons_use_case = provide(ListLessonsUseCase, scope=Scope.REQUEST)
    create_lesson_use_case = provide(CreateLessonUseCase, scope=Scope.REQUEST)
    update_lesson_use_case = provide(UpdateLessonUseCase, scope=Scope.REQUEST)
    delete_lesson_use_case = provide(DeleteLessonUseCase, scope=Scope.REQUEST)
    get_lesson_detail_use_case = provide(GetLessonDetailUseCase, scope=Scope.REQUEST)
    get_lesson_by_slug_use_case = provide(GetLessonBySlugUseCase, scope=Scope.REQUEST)
    reorder_lessons_use_case = provide(ReorderLessonsUseCase, scope=Scope.REQUEST)
    index_lesson_use_case = provide(IndexLessonUseCase, scope=Scope.REQUEST)
    lesson_embedding_indexer = provide(
        LessonEmbeddingIndexer, scope=Scope.REQUEST
    )
    lesson_index_scheduler = provide(LessonIndexScheduler, scope=Scope.REQUEST)
    question_embedding_service = provide(
        QuestionEmbeddingService, scope=Scope.REQUEST
    )

    @provide(scope=Scope.REQUEST)
    def lesson_chunker(self) -> LessonChunker:
        return LessonChunker(
            target_tokens=settings.lesson_chunk_target_tokens,
            max_tokens=settings.lesson_chunk_max_tokens,
        )

    list_modules_use_case = provide(ListModulesUseCase, scope=Scope.REQUEST)
    create_module_use_case = provide(CreateModuleUseCase, scope=Scope.REQUEST)
    update_module_use_case = provide(UpdateModuleUseCase, scope=Scope.REQUEST)
    delete_module_use_case = provide(DeleteModuleUseCase, scope=Scope.REQUEST)
    reorder_modules_use_case = provide(ReorderModulesUseCase, scope=Scope.REQUEST)

    # auth & me
    proxy_login_use_case = provide(LoginByManageAccountUseCase, scope=Scope.REQUEST)
    google_auth_use_case = provide(GoogleAuthUseCase, scope=Scope.REQUEST)

    @provide(scope=Scope.REQUEST)
    def logout_use_case(self, cache: ProfileCache) -> LogoutUseCase:
        return LogoutUseCase(cache)

    @provide(scope=Scope.REQUEST)
    def get_profile_use_case(
        self,
        cache: ProfileCache,
        user_repo: IUserRepository,
        manage_client: IManageService,
    ) -> GetProfileUseCase:
        return GetProfileUseCase(cache, user_repo, manage_client)

    @provide(scope=Scope.REQUEST)
    def pdf_parser_service(self) -> PDFParserService:
        return PDFParserService()

    @provide(scope=Scope.REQUEST)
    def user_service(
        self,
        user_repo: IUserRepository,
        manage_client: IManageService,
        redis: Redis,
    ) -> UserService:
        return UserService(user_repo, manage_client, redis)

    # comments
    create_comment_use_case = provide(CreateCommentUseCase, scope=Scope.REQUEST)
    get_comments_use_case = provide(GetCommentsUseCase, scope=Scope.REQUEST)
    toggle_reaction_use_case = provide(ToggleReactionUseCase, scope=Scope.REQUEST)
    delete_comment_use_case = provide(DeleteCommentUseCase, scope=Scope.REQUEST)

    # PDF Import
    get_import_status_use_case = provide(GetImportStatusUseCase, scope=Scope.REQUEST)
    review_draft_questions_use_case = provide(ReviewDraftQuestionsUseCase, scope=Scope.REQUEST)
    heartbeat_lock_use_case = provide(HeartbeatLockUseCase, scope=Scope.REQUEST)

    @provide(scope=Scope.REQUEST)
    def pdf_ai_parser_service(self, s3_client: IS3Client) -> PDFAIParserService:
        return PDFAIParserService(s3_client)

    @provide(scope=Scope.REQUEST)
    def start_import_use_case(
        self,
        session: AsyncSession,
        import_session_repo: IImportSessionRepository,
        question_repo: IQuestionRepository,
        ai_parser: PDFAIParserService,
    ) -> StartImportUseCase:
        return StartImportUseCase(
            session=session,
            import_session_repo=import_session_repo,
            question_repo=question_repo,
            ai_parser=ai_parser,
        )

    @provide(scope=Scope.REQUEST)
    def approve_question_use_case(
        self,
        session: AsyncSession,
        redis: Redis,
    ) -> ApproveQuestionUseCase:
        return ApproveQuestionUseCase(session=session, redis=redis)

    @provide(scope=Scope.REQUEST)
    def reject_question_use_case(
        self,
        session: AsyncSession,
        redis: Redis,
        s3_client: IS3Client,
    ) -> RejectQuestionUseCase:
        return RejectQuestionUseCase(session=session, redis=redis, s3_client=s3_client)

    @provide(scope=Scope.REQUEST)
    def regenerate_solution_use_case(
        self,
        session: AsyncSession,
        ai_parser: PDFAIParserService,
    ) -> RegenerateSolutionUseCase:
        return RegenerateSolutionUseCase(session=session, ai_parser=ai_parser)

    @provide(scope=Scope.REQUEST)
    def acquire_lock_use_case(
        self,
        session: AsyncSession,
        redis: Redis,
    ) -> AcquireLockUseCase:
        return AcquireLockUseCase(session=session, redis=redis)
