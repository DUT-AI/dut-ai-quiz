from dishka import Provider, Scope, provide

from app.application.services.pdf_parser import PDFParserService
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
from app.application.use_cases.auth.auth_use_case import (
    GoogleAuthUseCase,
    LogoutUseCase,
    ProxyLoginUseCase,
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
from app.application.use_cases.me.me_use_case import GetProfileUseCase
from app.application.use_cases.practice.gamification_use_case import (
    PatchGamificationAnswerUseCase,
    StartGamificationSessionUseCase,
    UseItemGamificationUseCase,
)
from app.application.use_cases.practice.practice_use_case import (
    FinishPracticeSessionUseCase,
    GetPracticeSessionUseCase,
    ListPracticeHistoryUseCase,
    PatchPracticeAnswersUseCase,
    StartPracticeSessionUseCase,
)
from app.application.use_cases.questions import (
    BulkCreateQuestionsUseCase,
    CreateQuestionUseCase,
    DeleteQuestionUseCase,
    GetQuestionUseCase,
    ListQuestionsUseCase,
    UpdateQuestionUseCase,
)
from app.domain.events.bus import EventBus
from app.domain.interfaces import (
    IAttemptRepository,
    IFocusEventRepository,
    IUserRepository,
)
from app.infrastructure.cache.redis_client import ProfileCache
from app.infrastructure.clients import ManageServiceClient


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

    # questions
    create_question_use_case = provide(CreateQuestionUseCase, scope=Scope.REQUEST)
    delete_question_use_case = provide(DeleteQuestionUseCase, scope=Scope.REQUEST)
    get_question_use_case = provide(GetQuestionUseCase, scope=Scope.REQUEST)
    list_questions_use_case = provide(ListQuestionsUseCase, scope=Scope.REQUEST)
    update_question_use_case = provide(UpdateQuestionUseCase, scope=Scope.REQUEST)
    bulk_create_questions_use_case = provide(
        BulkCreateQuestionsUseCase, scope=Scope.REQUEST
    )

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

    # practice
    start_practice_session_use_case = provide(
        StartPracticeSessionUseCase, scope=Scope.REQUEST
    )
    start_gamification_session_use_case = provide(
        StartGamificationSessionUseCase, scope=Scope.REQUEST
    )
    use_item_gamification_use_case = provide(
        UseItemGamificationUseCase, scope=Scope.REQUEST
    )
    patch_gamification_answer_use_case = provide(
        PatchGamificationAnswerUseCase, scope=Scope.REQUEST
    )
    get_practice_session_use_case = provide(
        GetPracticeSessionUseCase, scope=Scope.REQUEST
    )
    patch_practice_answers_use_case = provide(
        PatchPracticeAnswersUseCase, scope=Scope.REQUEST
    )
    finish_practice_session_use_case = provide(
        FinishPracticeSessionUseCase, scope=Scope.REQUEST
    )
    list_practice_history_use_case = provide(
        ListPracticeHistoryUseCase, scope=Scope.REQUEST
    )

    list_lessons_use_case = provide(ListLessonsUseCase, scope=Scope.REQUEST)
    create_lesson_use_case = provide(CreateLessonUseCase, scope=Scope.REQUEST)
    update_lesson_use_case = provide(UpdateLessonUseCase, scope=Scope.REQUEST)
    delete_lesson_use_case = provide(DeleteLessonUseCase, scope=Scope.REQUEST)
    get_lesson_detail_use_case = provide(GetLessonDetailUseCase, scope=Scope.REQUEST)
    get_lesson_by_slug_use_case = provide(GetLessonBySlugUseCase, scope=Scope.REQUEST)

    # auth & me
    proxy_login_use_case = provide(ProxyLoginUseCase, scope=Scope.REQUEST)
    google_auth_use_case = provide(GoogleAuthUseCase, scope=Scope.REQUEST)

    @provide(scope=Scope.REQUEST)
    def logout_use_case(self, cache: ProfileCache) -> LogoutUseCase:
        return LogoutUseCase(cache)

    @provide(scope=Scope.REQUEST)
    def get_profile_use_case(
        self,
        cache: ProfileCache,
        user_repo: IUserRepository,
        manage_client: ManageServiceClient,
    ) -> GetProfileUseCase:
        return GetProfileUseCase(cache, user_repo, manage_client)

    @provide(scope=Scope.REQUEST)
    def pdf_parser_service(self) -> PDFParserService:
        return PDFParserService()
