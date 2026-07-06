"""
Use cases for Dependency Request management
"""
from datetime import datetime
from uuid import UUID, uuid4

from app.domain.entities.dependency_request import DependencyRequestEntity
from app.domain.value_objects.enums import DependencyRequestStatus
from app.infrastructure.repositories.dependency_requests import DependencyRequestRepository


class CreateDependencyRequestUseCase:
    def __init__(self, repo: DependencyRequestRepository):
        self.repo = repo

    async def execute(
        self,
        hackathon_id: UUID,
        user_id: int,
        package_name: str,
        package_version: str | None,
        reason: str,
        task_id: UUID | None = None,
        team_id: UUID | None = None,
    ) -> DependencyRequestEntity:
        """User creates a dependency request."""
        entity = DependencyRequestEntity(
            id=uuid4(),
            hackathon_id=hackathon_id,
            task_id=task_id,
            user_id=user_id,
            team_id=team_id,
            package_name=package_name.strip(),
            package_version=package_version.strip() if package_version else None,
            reason=reason,
            status=DependencyRequestStatus.PENDING,
            admin_note=None,
            created_at=datetime.utcnow(),
        )

        return await self.repo.add(entity)


class ListUserDependencyRequestsUseCase:
    def __init__(self, repo: DependencyRequestRepository):
        self.repo = repo

    async def execute(self, user_id: int) -> list[DependencyRequestEntity]:
        """List all dependency requests created by a user."""
        return await self.repo.list_by_user(user_id)


class ListHackathonDependencyRequestsUseCase:
    def __init__(self, repo: DependencyRequestRepository):
        self.repo = repo

    async def execute(self, hackathon_id: UUID) -> list[DependencyRequestEntity]:
        """List all dependency requests for a specific hackathon."""
        return await self.repo.list_by_hackathon(hackathon_id)


class ListAllDependencyRequestsUseCase:
    def __init__(self, repo: DependencyRequestRepository):
        self.repo = repo

    async def execute(self, pending_only: bool = False) -> list[DependencyRequestEntity]:
        """Admin: List all dependency requests."""
        if pending_only:
            return await self.repo.list_pending()
        return await self.repo.list_all()


class ApproveDependencyRequestUseCase:
    def __init__(self, repo: DependencyRequestRepository):
        self.repo = repo

    async def execute(
        self,
        request_id: UUID,
        admin_id: int,
        admin_note: str | None = None,
    ) -> DependencyRequestEntity:
        """Admin approves a dependency request."""
        entity = await self.repo.get(request_id)
        if not entity:
            raise ValueError(f"Dependency request {request_id} not found")

        entity.approve(admin_id, admin_note)
        return await self.repo.update(entity)


class RejectDependencyRequestUseCase:
    def __init__(self, repo: DependencyRequestRepository):
        self.repo = repo

    async def execute(
        self,
        request_id: UUID,
        admin_id: int,
        admin_note: str,
    ) -> DependencyRequestEntity:
        """Admin rejects a dependency request with a reason."""
        entity = await self.repo.get(request_id)
        if not entity:
            raise ValueError(f"Dependency request {request_id} not found")

        if not admin_note:
            raise ValueError("Admin note is required when rejecting a request")

        entity.reject(admin_id, admin_note)
        return await self.repo.update(entity)


class GetDependencyRequestUseCase:
    def __init__(self, repo: DependencyRequestRepository):
        self.repo = repo

    async def execute(self, request_id: UUID) -> DependencyRequestEntity:
        """Get a specific dependency request."""
        entity = await self.repo.get(request_id)
        if not entity:
            raise ValueError(f"Dependency request {request_id} not found")
        return entity
