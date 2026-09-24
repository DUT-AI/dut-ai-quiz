from datetime import datetime
from uuid import UUID, uuid4

from app.core.datetime_utils import utc_to_ict
from app.domain.entities.hackathon import HackathonEntity
from app.domain.interfaces import IHackathonRepository
from app.presentation.schemas.hackathons import HackathonCreate, HackathonUpdate
from fastapi import HTTPException


class CreateHackathonUseCase:
    def __init__(self, hackathon_repo: IHackathonRepository):
        self._hackathon_repo = hackathon_repo

    async def execute(self, payload: HackathonCreate, user_id: int) -> HackathonEntity:
        if payload.start_time and payload.end_time and payload.start_time >= payload.end_time:
            raise HTTPException(status_code=400, detail="start_time must be before end_time")
        name = payload.name.strip()
        if not name:
            raise HTTPException(status_code=400, detail="name must not be empty")
        entity = HackathonEntity(
            id=uuid4(),
            name=name,
            description=payload.description,
            rules=payload.rules,
            start_time=utc_to_ict(payload.start_time).replace(tzinfo=None)
            if payload.start_time
            else None,
            end_time=utc_to_ict(payload.end_time).replace(tzinfo=None)
            if payload.end_time
            else None,
            participation_mode=payload.participation_mode,
            max_team_members=payload.max_team_members,
            created_by=user_id,
            created_at=datetime.now(),
        )
        return await self._hackathon_repo.add(entity)


class ListHackathonsUseCase:
    def __init__(self, hackathon_repo: IHackathonRepository):
        self._hackathon_repo = hackathon_repo

    async def execute(self, user_id: int, quiz_role: str) -> list[HackathonEntity]:
        return await self._hackathon_repo.list_all()


class GetHackathonUseCase:
    def __init__(self, hackathon_repo: IHackathonRepository):
        self._hackathon_repo = hackathon_repo

    async def execute(
        self, hackathon_id: UUID, user_id: int, quiz_role: str
    ) -> HackathonEntity | None:
        entity = await self._hackathon_repo.get(hackathon_id)
        return entity


class UpdateHackathonUseCase:
    def __init__(self, hackathon_repo: IHackathonRepository):
        self._hackathon_repo = hackathon_repo

    async def execute(
        self,
        hackathon_id: UUID,
        payload: HackathonUpdate,
        user_id: int,
        is_admin: bool = False,
    ) -> HackathonEntity | None:
        entity = await self._hackathon_repo.get(hackathon_id)
        if not entity:
            return None

        # ABAC Ownership Check: Only owner or admin can update
        if not is_admin and entity.created_by != user_id:
            raise HTTPException(
                status_code=403,
                detail="Forbidden: You do not have permission to update this hackathon (Ownership required)",
            )

        if payload.start_time and payload.end_time and payload.start_time >= payload.end_time:
            raise HTTPException(status_code=400, detail="start_time must be before end_time")
        data = payload.model_dump(exclude_unset=True)
        for k, v in data.items():
            if k in ["start_time", "end_time"] and v is not None:
                v = utc_to_ict(v).replace(tzinfo=None)
            setattr(entity, k, v)

        return await self._hackathon_repo.update(entity)


class DeleteHackathonUseCase:
    def __init__(self, hackathon_repo: IHackathonRepository):
        self._hackathon_repo = hackathon_repo

    async def execute(self, hackathon_id: UUID, user_id: int, is_admin: bool = False) -> bool:
        entity = await self._hackathon_repo.get(hackathon_id)
        if not entity:
            return False

        # ABAC Ownership Check: Only owner or admin can delete
        if not is_admin and entity.created_by != user_id:
            raise HTTPException(
                status_code=403,
                detail="Forbidden: You do not have permission to delete this hackathon (Ownership required)",
            )

        await self._hackathon_repo.delete(entity)
        return True
