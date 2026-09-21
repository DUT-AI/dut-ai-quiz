from typing import Protocol
from uuid import UUID

from app.domain.entities.hackathon import (
    HackathonEntity,
    HackathonRegistrationEntity,
    HackathonTaskEntity,
    HackathonTeamEntity,
)
from app.domain.entities.submission import HackathonSubmissionEntity


class IHackathonRepository(Protocol):
    async def get(self, hackathon_id: UUID) -> HackathonEntity | None:
        ...

    async def list_for_admin(self, user_id: int) -> list[HackathonEntity]:
        ...

    async def list_all(self) -> list[HackathonEntity]:
        ...

    async def add(self, entity: HackathonEntity) -> HackathonEntity:
        ...

    async def update(self, entity: HackathonEntity) -> HackathonEntity:
        ...

    async def delete(self, entity: HackathonEntity) -> None:
        ...


class IHackathonTaskRepository(Protocol):
    async def exists_name(self, hackathon_id: UUID, name: str) -> bool:
        ...

    async def get(self, task_id: UUID) -> HackathonTaskEntity | None:
        ...

    async def list_for_hackathon(self, hackathon_id: UUID) -> list[HackathonTaskEntity]:
        ...

    async def add(self, entity: HackathonTaskEntity) -> HackathonTaskEntity:
        ...

    async def update(self, entity: HackathonTaskEntity) -> HackathonTaskEntity:
        ...

    async def delete(self, entity: HackathonTaskEntity) -> None:
        ...


class IHackathonTeamRepository(Protocol):
    async def get(self, team_id: UUID) -> HackathonTeamEntity | None:
        ...

    async def get_by_code(self, code: str) -> HackathonTeamEntity | None:
        ...

    async def exists_name(self, hackathon_id: UUID, name: str) -> bool:
        ...

    async def get_user_team(self, hackathon_id: UUID, user_id: int) -> HackathonTeamEntity | None:
        ...

    async def add(self, entity: HackathonTeamEntity) -> HackathonTeamEntity:
        ...

    async def update(self, entity: HackathonTeamEntity) -> HackathonTeamEntity:
        ...

    async def delete(self, entity: HackathonTeamEntity) -> None:
        ...


class IHackathonRegistrationRepository(Protocol):
    async def get(self, registration_id: UUID) -> HackathonRegistrationEntity | None:
        ...

    async def get_user_registration(
        self, hackathon_id: UUID, user_id: int
    ) -> HackathonRegistrationEntity | None:
        ...

    async def get_team_registration(
        self, hackathon_id: UUID, team_id: UUID
    ) -> HackathonRegistrationEntity | None:
        ...

    async def list_for_hackathon(
        self, hackathon_id: UUID
    ) -> list[HackathonRegistrationEntity]:
        ...

    async def add(
        self, entity: HackathonRegistrationEntity
    ) -> HackathonRegistrationEntity:
        ...

    async def update(
        self, entity: HackathonRegistrationEntity
    ) -> HackathonRegistrationEntity:
        ...

    async def update_full(
        self, entity: HackathonRegistrationEntity
    ) -> HackathonRegistrationEntity:
        ...

    async def delete(self, entity: HackathonRegistrationEntity) -> None:
        ...


class IHackathonSubmissionRepository(Protocol):
    async def get(self, submission_id: UUID) -> HackathonSubmissionEntity | None:
        ...

    async def add(self, entity: HackathonSubmissionEntity) -> HackathonSubmissionEntity:
        ...

    async def update(self, entity: HackathonSubmissionEntity) -> HackathonSubmissionEntity:
        ...

    async def list_for_task(
        self, task_id: UUID, user_id: int | None = None, team_id: UUID | None = None
    ) -> list[HackathonSubmissionEntity]:
        ...

    async def count_submissions(
        self, task_id: UUID, user_id: int | None = None, team_id: UUID | None = None
    ) -> int:
        ...

    async def acquire_quota_lock(
        self, task_id: UUID, user_id: int | None = None, team_id: UUID | None = None
    ) -> None:
        ...

    async def commit(self) -> None:
        ...

    async def list_for_hackathon(
        self, hackathon_id: UUID
    ) -> list[HackathonSubmissionEntity]:
        ...

    async def get_last_submission(
        self, task_id: UUID, user_id: int | None = None, team_id: UUID | None = None
    ) -> HackathonSubmissionEntity | None:
        ...
