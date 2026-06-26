from __future__ import annotations

from dataclasses import dataclass, field
from uuid import UUID

from app.application.use_cases.hackathon.ports import (
    CompetitionRepository,
    SubmissionRepository,
    TaskRepository,
)
from app.domain.hackathon.models import CompetitionEntity, SubmissionEntity, TaskEntity


@dataclass
class InMemoryHackathonStore:
    competitions: dict[UUID, CompetitionEntity] = field(default_factory=dict)
    tasks: dict[UUID, TaskEntity] = field(default_factory=dict)
    submissions: dict[UUID, SubmissionEntity] = field(default_factory=dict)


class InMemoryCompetitionRepository(CompetitionRepository):
    def __init__(self, store: InMemoryHackathonStore) -> None:
        self._store = store

    async def list_all(self) -> list[CompetitionEntity]:
        return sorted(self._store.competitions.values(), key=lambda entity: entity.created_at, reverse=True)

    async def get(self, competition_id: UUID) -> CompetitionEntity | None:
        return self._store.competitions.get(competition_id)

    async def add(self, entity: CompetitionEntity) -> CompetitionEntity:
        self._store.competitions[entity.id] = entity
        return entity

    async def update(self, entity: CompetitionEntity) -> CompetitionEntity:
        self._store.competitions[entity.id] = entity
        return entity

    async def delete(self, entity: CompetitionEntity) -> None:
        self._store.competitions.pop(entity.id, None)


class InMemoryTaskRepository(TaskRepository):
    def __init__(self, store: InMemoryHackathonStore) -> None:
        self._store = store

    async def list_by_competition(self, competition_id: UUID) -> list[TaskEntity]:
        return [task for task in self._store.tasks.values() if task.competition_id == competition_id]

    async def get(self, task_id: UUID) -> TaskEntity | None:
        return self._store.tasks.get(task_id)

    async def add(self, entity: TaskEntity) -> TaskEntity:
        self._store.tasks[entity.id] = entity
        return entity

    async def update(self, entity: TaskEntity) -> TaskEntity:
        self._store.tasks[entity.id] = entity
        return entity

    async def delete(self, entity: TaskEntity) -> None:
        self._store.tasks.pop(entity.id, None)


class InMemorySubmissionRepository(SubmissionRepository):
    def __init__(self, store: InMemoryHackathonStore) -> None:
        self._store = store

    async def list_by_competition(self, competition_id: UUID) -> list[SubmissionEntity]:
        return [submission for submission in self._store.submissions.values() if submission.competition_id == competition_id]

    async def list_by_participant(self, competition_id: UUID, participant_id: int) -> list[SubmissionEntity]:
        return [
            submission
            for submission in self._store.submissions.values()
            if submission.competition_id == competition_id and submission.participant_id == participant_id
        ]

    async def get(self, submission_id: UUID) -> SubmissionEntity | None:
        return self._store.submissions.get(submission_id)

    async def add(self, entity: SubmissionEntity) -> SubmissionEntity:
        self._store.submissions[entity.id] = entity
        return entity

    async def update(self, entity: SubmissionEntity) -> SubmissionEntity:
        self._store.submissions[entity.id] = entity
        return entity

    async def count_successful_by_participant(self, competition_id: UUID, participant_id: int) -> int:
        return sum(
            1
            for submission in self._store.submissions.values()
            if submission.competition_id == competition_id
            and submission.participant_id == participant_id
            and submission.is_successful()
        )

    async def latest_successful_by_participant(self, competition_id: UUID, participant_id: int) -> SubmissionEntity | None:
        submissions = [
            submission
            for submission in self._store.submissions.values()
            if submission.competition_id == competition_id
            and submission.participant_id == participant_id
            and submission.is_successful()
        ]
        if not submissions:
            return None
        return sorted(submissions, key=lambda submission: submission.finished_at or submission.submitted_at, reverse=True)[0]
