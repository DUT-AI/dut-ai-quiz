from datetime import datetime
from uuid import UUID, uuid4

from app.domain.entities.hackathon import HackathonTaskEntity
from app.infrastructure.repositories.hackathons import (
    HackathonRepository,
    HackathonTaskRepository,
)
from app.presentation.schemas.hackathons import HackathonTaskCreate, HackathonTaskUpdate


class CreateHackathonTaskUseCase:
    def __init__(
        self,
        hackathon_repo: HackathonRepository,
        task_repo: HackathonTaskRepository,
    ):
        self._hackathon_repo = hackathon_repo
        self._task_repo = task_repo

    async def execute(
        self,
        hackathon_id: UUID,
        payload: HackathonTaskCreate,
        admin_user_id: int,
    ) -> HackathonTaskEntity | None:
        hackathon = await self._hackathon_repo.get(hackathon_id)
        if not hackathon or hackathon.created_by != admin_user_id:
            return None
        now = datetime.now()
        if hackathon.start_time and hackathon.start_time <= now:
            raise ValueError("Cannot create task after hackathon has started.")
        if hackathon.end_time and hackathon.end_time <= now:
            raise ValueError("Cannot create task after hackathon has ended.")
        name = payload.name.strip()
        if await self._task_repo.exists_name(hackathon_id, name):
            raise ValueError("Task name already exists in this hackathon.")
        description = payload.problem_description_md.strip()
        if not name:
            raise ValueError("name must not be empty")
        if not description:
            raise ValueError("problem_description_md must not be empty")
        private_test_url = payload.private_test_url.strip()
        public_test_url = payload.public_test_url.strip()
        if not private_test_url:
            raise ValueError("private_test_url must not be empty")
        if not public_test_url:
            raise ValueError("public_test_url must not be empty")
        if payload.max_submissions < 1:
            raise ValueError("max_submissions must be >= 1")

        entity = HackathonTaskEntity(
            id=uuid4(),
            hackathon_id=hackathon_id,
            name=name,
            problem_description_md=description,
            private_test_url=private_test_url,
            public_test_url=public_test_url,
            metric_type=payload.metric_type,
            max_submissions=payload.max_submissions,
            created_at=datetime.now(),
        )
        return await self._task_repo.add(entity)


class ListHackathonTasksUseCase:
    def __init__(
        self,
        hackathon_repo: HackathonRepository,
        task_repo: HackathonTaskRepository,
    ):
        self._hackathon_repo = hackathon_repo
        self._task_repo = task_repo

    async def execute(
        self,
        hackathon_id: UUID,
        user_id: int,
        quiz_role: str,
    ) -> list[HackathonTaskEntity] | None:
        hackathon = await self._hackathon_repo.get(hackathon_id)
        if not hackathon:
            return None
        if quiz_role in ["admin", "MENTOR"] and hackathon.created_by != user_id:
            return None
        return await self._task_repo.list_for_hackathon(hackathon_id)


class GetHackathonTaskUseCase:
    def __init__(
        self,
        hackathon_repo: HackathonRepository,
        task_repo: HackathonTaskRepository,
    ):
        self._hackathon_repo = hackathon_repo
        self._task_repo = task_repo

    async def execute(
        self,
        hackathon_id: UUID,
        task_id: UUID,
        user_id: int,
        quiz_role: str,
    ) -> HackathonTaskEntity | None:
        hackathon = await self._hackathon_repo.get(hackathon_id)
        if not hackathon:
            return None
        if quiz_role in ["admin", "MENTOR"] and hackathon.created_by != user_id:
            return None

        task = await self._task_repo.get(task_id)
        if not task or task.hackathon_id != hackathon_id:
            return None
        return task


class UpdateHackathonTaskUseCase:
    def __init__(
        self,
        hackathon_repo: HackathonRepository,
        task_repo: HackathonTaskRepository,
    ):
        self._hackathon_repo = hackathon_repo
        self._task_repo = task_repo

    async def execute(
        self,
        hackathon_id: UUID,
        task_id: UUID,
        payload: HackathonTaskUpdate,
        admin_user_id: int,
    ) -> HackathonTaskEntity | None:
        hackathon = await self._hackathon_repo.get(hackathon_id)
        if not hackathon or hackathon.created_by != admin_user_id:
            return None

        task = await self._task_repo.get(task_id)
        if not task or task.hackathon_id != hackathon_id:
            return None

        data = payload.model_dump(exclude_unset=True)
        if "name" in data and data["name"] is not None:
            data["name"] = data["name"].strip()
            if not data["name"]:
                raise ValueError("name must not be empty")
        if (
            "problem_description_md" in data
            and data["problem_description_md"] is not None
        ):
            data["problem_description_md"] = data["problem_description_md"].strip()
            if not data["problem_description_md"]:
                raise ValueError("problem_description_md must not be empty")
        if "max_submissions" in data and data["max_submissions"] is not None:
            if data["max_submissions"] < 1:
                raise ValueError("max_submissions must be >= 1")

        for key, value in data.items():
            if key in {"private_test_url", "public_test_url"} and value is not None:
                value = value.strip()
                if not value:
                    raise ValueError(f"{key} must not be empty")
            setattr(task, key, value)

        task.updated_at = datetime.now()
        return await self._task_repo.update(task)


class DeleteHackathonTaskUseCase:
    def __init__(
        self,
        hackathon_repo: HackathonRepository,
        task_repo: HackathonTaskRepository,
    ):
        self._hackathon_repo = hackathon_repo
        self._task_repo = task_repo

    async def execute(
        self,
        hackathon_id: UUID,
        task_id: UUID,
        admin_user_id: int,
    ) -> bool:
        hackathon = await self._hackathon_repo.get(hackathon_id)
        if not hackathon or hackathon.created_by != admin_user_id:
            return False

        task = await self._task_repo.get(task_id)
        if not task or task.hackathon_id != hackathon_id:
            return False

        await self._task_repo.delete(task)
        return True
