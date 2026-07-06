from datetime import datetime
from uuid import UUID, uuid4

from fastapi import HTTPException

from app.core.datetime_utils import utc_to_ict
from app.domain.entities.hackathon import HackathonEntity
from app.infrastructure.repositories.hackathons import HackathonRepository
from app.presentation.schemas.hackathons import HackathonCreate, HackathonUpdate


class CreateHackathonUseCase:
    def __init__(self, hackathon_repo: HackathonRepository):
        self._hackathon_repo = hackathon_repo

    async def execute(
        self,
        payload: HackathonCreate,
        admin_user_id: int,
    ) -> HackathonEntity:
        if payload.start_time and payload.end_time and payload.start_time >= payload.end_time:
            raise HTTPException(
                status_code=400,
                detail="start_time must be before end_time",
            )

        name = payload.name.strip()
        if not name:
            raise HTTPException(
                status_code=400,
                detail="name must not be empty",
            )

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
            created_by=admin_user_id,
            created_at=datetime.now(),
        )

        return await self._hackathon_repo.add(entity)


class ListHackathonsUseCase:
    def __init__(self, hackathon_repo: HackathonRepository):
        self._hackathon_repo = hackathon_repo

    async def execute(
        self,
        user_id: int | None = None,
        quiz_role: str | None = None,
    ) -> list[HackathonEntity]:
        """
        Public read:
        - Nếu không truyền user_id / quiz_role thì trả danh sách hackathon để frontend hiển thị public.
        - Nếu là admin hoặc mentor và có truyền user_id thì giữ logic cũ: chỉ xem hackathon mình tạo.
        - User thường xem được danh sách public.
        """
        if user_id is None or quiz_role is None:
            return await self._hackathon_repo.list_all()

        if quiz_role in ["admin", "MENTOR"]:
            return await self._hackathon_repo.list_for_admin(user_id)

        return await self._hackathon_repo.list_all()


class GetHackathonUseCase:
    def __init__(self, hackathon_repo: HackathonRepository):
        self._hackathon_repo = hackathon_repo

    async def execute(
        self,
        hackathon_id: UUID,
        user_id: int | None = None,
        quiz_role: str | None = None,
    ) -> HackathonEntity | None:
        """
        Public read:
        - GET /hackathons/{id} không cần token vẫn xem được thông tin cuộc thi.
        - Nếu router truyền user admin/mentor thì vẫn giữ logic cũ: admin/mentor chỉ xem cuộc thi mình tạo.
        """
        entity = await self._hackathon_repo.get(hackathon_id)
        if not entity:
            return None

        if user_id is None or quiz_role is None:
            return entity

        if quiz_role in ["admin", "MENTOR"] and entity.created_by != user_id:
            return None

        return entity


class UpdateHackathonUseCase:
    def __init__(self, hackathon_repo: HackathonRepository):
        self._hackathon_repo = hackathon_repo

    async def execute(
        self,
        hackathon_id: UUID,
        payload: HackathonUpdate,
        admin_user_id: int,
    ) -> HackathonEntity | None:
        entity = await self._hackathon_repo.get(hackathon_id)
        if not entity or entity.created_by != admin_user_id:
            return None

        if payload.start_time and payload.end_time and payload.start_time >= payload.end_time:
            raise HTTPException(
                status_code=400,
                detail="start_time must be before end_time",
            )

        data = payload.model_dump(exclude_unset=True)

        for key, value in data.items():
            if key in ["start_time", "end_time"] and value is not None:
                value = utc_to_ict(value).replace(tzinfo=None)

            setattr(entity, key, value)

        return await self._hackathon_repo.update(entity)


class DeleteHackathonUseCase:
    def __init__(self, hackathon_repo: HackathonRepository):
        self._hackathon_repo = hackathon_repo

    async def execute(
        self,
        hackathon_id: UUID,
        admin_user_id: int,
    ) -> bool:
        entity = await self._hackathon_repo.get(hackathon_id)
        if not entity or entity.created_by != admin_user_id:
            return False

        await self._hackathon_repo.delete(entity)
        return True