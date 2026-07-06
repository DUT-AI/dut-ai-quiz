"""
Use cases for Runtime Profile management (Admin operations)
"""
from datetime import datetime
from uuid import UUID, uuid4

from app.domain.entities.runtime_profile import RuntimeProfileEntity
from app.infrastructure.repositories.runtime_profiles import RuntimeProfileRepository


class CreateRuntimeProfileUseCase:
    def __init__(self, repo: RuntimeProfileRepository):
        self.repo = repo

    async def execute(
        self,
        name: str,
        display_name: str,
        description: str,
        docker_image: str,
        docker_image_tag: str,
        python_version: str | None,
        cuda_version: str | None,
        allowed_packages_json: str | None,
        cpu_limit: float,
        memory_limit_mb: int,
        gpu_enabled: bool,
        gpu_limit: int,
        timeout_seconds: int,
        pids_limit: int,
        is_active: bool = True,
    ) -> RuntimeProfileEntity:
        """Create a new runtime profile."""
        # Validate unique name
        if await self.repo.exists_name(name):
            raise ValueError(f"Runtime profile with name '{name}' already exists")

        entity = RuntimeProfileEntity(
            id=uuid4(),
            name=name,
            display_name=display_name,
            description=description,
            docker_image=docker_image,
            docker_image_tag=docker_image_tag,
            python_version=python_version,
            cuda_version=cuda_version,
            allowed_packages_json=allowed_packages_json,
            cpu_limit=cpu_limit,
            memory_limit_mb=memory_limit_mb,
            gpu_enabled=gpu_enabled,
            gpu_limit=gpu_limit,
            timeout_seconds=timeout_seconds,
            pids_limit=pids_limit,
            is_active=is_active,
            created_at=datetime.utcnow(),
        )

        return await self.repo.add(entity)


class UpdateRuntimeProfileUseCase:
    def __init__(self, repo: RuntimeProfileRepository):
        self.repo = repo

    async def execute(
        self,
        profile_id: UUID,
        name: str | None = None,
        display_name: str | None = None,
        description: str | None = None,
        docker_image: str | None = None,
        docker_image_tag: str | None = None,
        python_version: str | None = None,
        cuda_version: str | None = None,
        allowed_packages_json: str | None = None,
        cpu_limit: float | None = None,
        memory_limit_mb: int | None = None,
        gpu_enabled: bool | None = None,
        gpu_limit: int | None = None,
        timeout_seconds: int | None = None,
        pids_limit: int | None = None,
        is_active: bool | None = None,
    ) -> RuntimeProfileEntity:
        """Update an existing runtime profile."""
        entity = await self.repo.get(profile_id)
        if not entity:
            raise ValueError(f"Runtime profile {profile_id} not found")

        # Check name uniqueness if changed
        if name and name != entity.name:
            if await self.repo.exists_name(name, exclude_id=profile_id):
                raise ValueError(f"Runtime profile with name '{name}' already exists")

        # Update fields
        if name:
            entity.name = name
        if display_name:
            entity.display_name = display_name
        if description is not None:
            entity.description = description
        if docker_image:
            entity.docker_image = docker_image
        if docker_image_tag:
            entity.docker_image_tag = docker_image_tag
        if python_version is not None:
            entity.python_version = python_version
        if cuda_version is not None:
            entity.cuda_version = cuda_version
        if allowed_packages_json is not None:
            entity.allowed_packages_json = allowed_packages_json
        if cpu_limit is not None:
            entity.cpu_limit = cpu_limit
        if memory_limit_mb is not None:
            entity.memory_limit_mb = memory_limit_mb
        if gpu_enabled is not None:
            entity.gpu_enabled = gpu_enabled
        if gpu_limit is not None:
            entity.gpu_limit = gpu_limit
        if timeout_seconds is not None:
            entity.timeout_seconds = timeout_seconds
        if pids_limit is not None:
            entity.pids_limit = pids_limit
        if is_active is not None:
            entity.is_active = is_active

        entity.updated_at = datetime.utcnow()

        return await self.repo.update(entity)


class GetRuntimeProfileUseCase:
    def __init__(self, repo: RuntimeProfileRepository):
        self.repo = repo

    async def execute(self, profile_id: UUID) -> RuntimeProfileEntity:
        """Get a runtime profile by ID."""
        entity = await self.repo.get(profile_id)
        if not entity:
            raise ValueError(f"Runtime profile {profile_id} not found")
        return entity


class ListRuntimeProfilesUseCase:
    def __init__(self, repo: RuntimeProfileRepository):
        self.repo = repo

    async def execute(self, active_only: bool = False) -> list[RuntimeProfileEntity]:
        """List runtime profiles. If active_only=True, only return active profiles."""
        if active_only:
            return await self.repo.list_active()
        return await self.repo.list_all()


class DeleteRuntimeProfileUseCase:
    def __init__(self, repo: RuntimeProfileRepository):
        self.repo = repo

    async def execute(self, profile_id: UUID) -> None:
        """
        Delete a runtime profile.
        Note: This will fail if there are submissions using this profile
        due to foreign key constraint.
        """
        entity = await self.repo.get(profile_id)
        if not entity:
            raise ValueError(f"Runtime profile {profile_id} not found")
        await self.repo.delete(entity)


class ToggleRuntimeProfileUseCase:
    def __init__(self, repo: RuntimeProfileRepository):
        self.repo = repo

    async def execute(self, profile_id: UUID, is_active: bool) -> RuntimeProfileEntity:
        """Enable or disable a runtime profile."""
        entity = await self.repo.get(profile_id)
        if not entity:
            raise ValueError(f"Runtime profile {profile_id} not found")

        entity.is_active = is_active
        entity.updated_at = datetime.utcnow()

        return await self.repo.update(entity)
