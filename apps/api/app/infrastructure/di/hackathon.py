from dishka import Provider, Scope, provide

from app.application.use_cases.hackathon.ports import (
    CompetitionRepository,
    SubmissionRepository,
    TaskRepository,
)
from app.application.use_cases.hackathon.use_cases import (
    CancelSubmissionUseCase,
    CreateCompetitionUseCase,
    CreateTaskUseCase,
    GetCompetitionLeaderboardUseCase,
    ListCompetitionsUseCase,
    ListTasksUseCase,
    RecordSubmissionResultUseCase,
    SubmitHackathonSolutionUseCase,
)
from app.infrastructure.repositories.hackathon.memory import (
    InMemoryCompetitionRepository,
    InMemoryHackathonStore,
    InMemorySubmissionRepository,
    InMemoryTaskRepository,
)


class HackathonProvider(Provider):
    @provide(scope=Scope.APP)
    def hackathon_store(self) -> InMemoryHackathonStore:
        return InMemoryHackathonStore()

    @provide(scope=Scope.APP)
    def competition_repo(
        self, store: InMemoryHackathonStore
    ) -> CompetitionRepository:
        return InMemoryCompetitionRepository(store)

    @provide(scope=Scope.APP)
    def task_repo(self, store: InMemoryHackathonStore) -> TaskRepository:
        return InMemoryTaskRepository(store)

    @provide(scope=Scope.APP)
    def submission_repo(
        self, store: InMemoryHackathonStore
    ) -> SubmissionRepository:
        return InMemorySubmissionRepository(store)

    create_competition_use_case = provide(CreateCompetitionUseCase, scope=Scope.REQUEST)
    list_competitions_use_case = provide(ListCompetitionsUseCase, scope=Scope.REQUEST)
    create_task_use_case = provide(CreateTaskUseCase, scope=Scope.REQUEST)
    list_tasks_use_case = provide(ListTasksUseCase, scope=Scope.REQUEST)
    submit_hackathon_solution_use_case = provide(SubmitHackathonSolutionUseCase, scope=Scope.REQUEST)
    cancel_submission_use_case = provide(CancelSubmissionUseCase, scope=Scope.REQUEST)
    record_submission_result_use_case = provide(RecordSubmissionResultUseCase, scope=Scope.REQUEST)
    get_competition_leaderboard_use_case = provide(GetCompetitionLeaderboardUseCase, scope=Scope.REQUEST)
