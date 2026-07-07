"""
Tests for Runtime Profile functionality
"""
import pytest
from datetime import datetime
from uuid import uuid4

from app.domain.entities.runtime_profile import RuntimeProfileEntity
from app.application.use_cases.runtime_profiles import (
    CreateRuntimeProfileUseCase,
    ListRuntimeProfilesUseCase,
)


class MockRuntimeProfileRepository:
    """Mock repository for testing."""
    
    def __init__(self):
        self.profiles = {}
    
    async def exists_name(self, name: str, exclude_id=None):
        for profile_id, profile in self.profiles.items():
            if profile.name == name:
                if exclude_id is None or profile_id != exclude_id:
                    return True
        return False
    
    async def add(self, entity: RuntimeProfileEntity) -> RuntimeProfileEntity:
        self.profiles[entity.id] = entity
        return entity
    
    async def list_active(self):
        return [p for p in self.profiles.values() if p.is_active]
    
    async def list_all(self):
        return list(self.profiles.values())


@pytest.mark.asyncio
async def test_create_runtime_profile():
    """Test creating a runtime profile."""
    repo = MockRuntimeProfileRepository()
    uc = CreateRuntimeProfileUseCase(repo)
    
    profile = await uc.execute(
        name="test-profile",
        display_name="Test Profile",
        description="Test Description",
        docker_image="python",
        docker_image_tag="3.10-slim",
        python_version="3.10",
        cuda_version=None,
        allowed_packages_json='{"numpy": "1.24.0"}',
        cpu_limit=2.0,
        memory_limit_mb=2048,
        gpu_enabled=False,
        gpu_limit=0,
        timeout_seconds=300,
        pids_limit=100,
        is_active=True,
    )
    
    assert profile.name == "test-profile"
    assert profile.display_name == "Test Profile"
    assert profile.cpu_limit == 2.0
    assert profile.is_active is True


@pytest.mark.asyncio
async def test_create_duplicate_name():
    """Test that duplicate names are rejected."""
    repo = MockRuntimeProfileRepository()
    uc = CreateRuntimeProfileUseCase(repo)
    
    # Create first profile
    await uc.execute(
        name="test-profile",
        display_name="Test Profile",
        description="Test",
        docker_image="python",
        docker_image_tag="3.10-slim",
        python_version="3.10",
        cuda_version=None,
        allowed_packages_json=None,
        cpu_limit=2.0,
        memory_limit_mb=2048,
        gpu_enabled=False,
        gpu_limit=0,
        timeout_seconds=300,
        pids_limit=100,
        is_active=True,
    )
    
    # Try to create duplicate
    with pytest.raises(ValueError, match="already exists"):
        await uc.execute(
            name="test-profile",  # Same name
            display_name="Different Display Name",
            description="Test",
            docker_image="python",
            docker_image_tag="3.10-slim",
            python_version="3.10",
            cuda_version=None,
            allowed_packages_json=None,
            cpu_limit=2.0,
            memory_limit_mb=2048,
            gpu_enabled=False,
            gpu_limit=0,
            timeout_seconds=300,
            pids_limit=100,
            is_active=True,
        )


@pytest.mark.asyncio
async def test_list_active_profiles():
    """Test listing only active profiles."""
    repo = MockRuntimeProfileRepository()
    
    # Add active profile
    active_profile = RuntimeProfileEntity(
        id=uuid4(),
        name="active-profile",
        display_name="Active",
        description="",
        docker_image="python",
        docker_image_tag="3.10",
        python_version="3.10",
        cuda_version=None,
        allowed_packages_json=None,
        cpu_limit=2.0,
        memory_limit_mb=2048,
        gpu_enabled=False,
        gpu_limit=0,
        timeout_seconds=300,
        pids_limit=100,
        is_active=True,
        created_at=datetime.utcnow(),
    )
    await repo.add(active_profile)
    
    # Add inactive profile
    inactive_profile = RuntimeProfileEntity(
        id=uuid4(),
        name="inactive-profile",
        display_name="Inactive",
        description="",
        docker_image="python",
        docker_image_tag="3.10",
        python_version="3.10",
        cuda_version=None,
        allowed_packages_json=None,
        cpu_limit=2.0,
        memory_limit_mb=2048,
        gpu_enabled=False,
        gpu_limit=0,
        timeout_seconds=300,
        pids_limit=100,
        is_active=False,
        created_at=datetime.utcnow(),
    )
    await repo.add(inactive_profile)
    
    # Test list active
    uc = ListRuntimeProfilesUseCase(repo)
    active_profiles = await uc.execute(active_only=True)
    
    assert len(active_profiles) == 1
    assert active_profiles[0].name == "active-profile"


@pytest.mark.asyncio
async def test_validate_active():
    """Test that validation raises error for inactive profiles."""
    profile = RuntimeProfileEntity(
        id=uuid4(),
        name="test",
        display_name="Test",
        description="",
        docker_image="python",
        docker_image_tag="3.10",
        python_version="3.10",
        cuda_version=None,
        allowed_packages_json=None,
        cpu_limit=2.0,
        memory_limit_mb=2048,
        gpu_enabled=False,
        gpu_limit=0,
        timeout_seconds=300,
        pids_limit=100,
        is_active=False,  # Inactive
        created_at=datetime.utcnow(),
    )
    
    with pytest.raises(ValueError, match="not active"):
        profile.validate_active()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
