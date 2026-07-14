from dishka import Provider, Scope, provide

from app.application.services.pdf_parser import PDFParserService
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
from app.application.use_cases.lessons.get_lesson_from_blog_uc import (
    GetLessonBySlugUseCase,
)
from app.application.use_cases.lessons.list_lessons_uc import ListLessonsUseCase
from app.application.use_cases.lessons.update_lesson_uc import UpdateLessonUseCase
from app.application.use_cases.modules import (
    CreateModuleUseCase,
    DeleteModuleUseCase,
    ListModulesUseCase,
    UpdateModuleUseCase,
    ReorderModulesUseCase,
    SuggestModulesUseCase,
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
)
from app.application.use_cases.tags.tags_use_case import (
    ListTagsUseCase,
    CreateTagUseCase,
    DeleteTagUseCase,
)
from app.application.use_cases.uploads.presign_upload import PresignUploadUseCase
from app.domain.events.bus import EventBus
from app.domain.interfaces import (
    IAttemptRepository,
    IFocusEventRepository,
    IManageService,
    IUserRepository,
)
from app.infrastructure.cache.redis_client import ProfileCache


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

    # questions
    create_question_use_case = provide(CreateQuestionUseCase, scope=Scope.REQUEST)
    delete_question_use_case = provide(DeleteQuestionUseCase, scope=Scope.REQUEST)
    get_question_use_case = provide(GetQuestionUseCase, scope=Scope.REQUEST)
    list_questions_use_case = provide(ListQuestionsUseCase, scope=Scope.REQUEST)
    update_question_use_case = provide(UpdateQuestionUseCase, scope=Scope.REQUEST)
    bulk_create_questions_use_case = provide(
        BulkCreateQuestionsUseCase, scope=Scope.REQUEST
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

    list_modules_use_case = provide(ListModulesUseCase, scope=Scope.REQUEST)
    create_module_use_case = provide(CreateModuleUseCase, scope=Scope.REQUEST)
    update_module_use_case = provide(UpdateModuleUseCase, scope=Scope.REQUEST)
    delete_module_use_case = provide(DeleteModuleUseCase, scope=Scope.REQUEST)
    reorder_modules_use_case = provide(ReorderModulesUseCase, scope=Scope.REQUEST)
    suggest_modules_use_case = provide(SuggestModulesUseCase, scope=Scope.REQUEST)

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
    ) -> UserService:
        return UserService(user_repo, manage_client)
