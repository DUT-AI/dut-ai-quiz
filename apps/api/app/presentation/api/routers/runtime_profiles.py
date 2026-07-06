"""
API Router for Runtime Profile management
"""
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database import get_session
from app.infrastructure.repositories.runtime_profiles import RuntimeProfileRepository
from app.application.use_cases.runtime_profiles import (
    CreateRuntimeProfileUseCase,
    UpdateRuntimeProfileUseCase,
    GetRuntimeProfileUseCase,
    ListRuntimeProfilesUseCase,
    DeleteRuntimeProfileUseCase,
    ToggleRuntimeProfileUseCase,
)
from app.presentation.schemas.runtime_profiles import (
    RuntimeProfileCreate,
    RuntimeProfileUpdate,
    RuntimeProfileResponse,
    RuntimeProfileListResponse,
    ToggleRuntimeProfileRequest,
)
from app.presentation.api.dependencies import get_current_user, require_admin

router = APIRouter(prefix="/runtime-profiles", tags=["Runtime Profiles"])


@router.get("/active", response_model=RuntimeProfileListResponse)
async def list_active_runtime_profiles(
    session: AsyncSession = Depends(get_session),
):
    """
    List all active runtime profiles (public endpoint for users to choose).
    """
    repo = RuntimeProfileRepository(session)
    uc = ListRuntimeProfilesUseCase(repo)
    
    profiles = await uc.execute(active_only=True)
    
    return RuntimeProfileListResponse(
        profiles=[RuntimeProfileResponse.model_validate(p) for p in profiles],
        total=len(profiles),
    )


@router.get("", response_model=RuntimeProfileListResponse)
async def list_all_runtime_profiles(
    session: AsyncSession = Depends(get_session),
    active_only: bool = True,
):
    """
    List runtime profiles. 
    By default shows only active profiles.
    Use ?active_only=false to see all (active and inactive).
    """
    repo = RuntimeProfileRepository(session)
    uc = ListRuntimeProfilesUseCase(repo)
    
    profiles = await uc.execute(active_only=active_only)
    
    return RuntimeProfileListResponse(
        profiles=[RuntimeProfileResponse.model_validate(p) for p in profiles],
        total=len(profiles),
    )


@router.post("", response_model=RuntimeProfileResponse, dependencies=[Depends(require_admin)], status_code=status.HTTP_201_CREATED)
async def create_runtime_profile(
    data: RuntimeProfileCreate,
    session: AsyncSession = Depends(get_session),
    _current_user: dict = Depends(get_current_user),
):
    """
    Admin: Create a new runtime profile.
    """
    repo = RuntimeProfileRepository(session)
    uc = CreateRuntimeProfileUseCase(repo)
    
    try:
        profile = await uc.execute(
            name=data.name,
            display_name=data.display_name,
            description=data.description,
            docker_image=data.docker_image,
            docker_image_tag=data.docker_image_tag,
            python_version=data.python_version,
            cuda_version=data.cuda_version,
            allowed_packages_json=data.allowed_packages_json,
            cpu_limit=data.cpu_limit,
            memory_limit_mb=data.memory_limit_mb,
            gpu_enabled=data.gpu_enabled,
            gpu_limit=data.gpu_limit,
            timeout_seconds=data.timeout_seconds,
            pids_limit=data.pids_limit,
            is_active=data.is_active,
        )
        await session.commit()
        return RuntimeProfileResponse.model_validate(profile)
    except ValueError as e:
        await session.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{profile_id}", response_model=RuntimeProfileResponse)
async def get_runtime_profile(
    profile_id: UUID,
    session: AsyncSession = Depends(get_session),
):
    """
    Get a runtime profile by ID (public endpoint).
    """
    repo = RuntimeProfileRepository(session)
    uc = GetRuntimeProfileUseCase(repo)
    
    try:
        profile = await uc.execute(profile_id)
        return RuntimeProfileResponse.model_validate(profile)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.patch("/{profile_id}", response_model=RuntimeProfileResponse, dependencies=[Depends(require_admin)])
async def update_runtime_profile(
    profile_id: UUID,
    data: RuntimeProfileUpdate,
    session: AsyncSession = Depends(get_session),
    _current_user: dict = Depends(get_current_user),
):
    """
    Admin: Update a runtime profile.
    """
    repo = RuntimeProfileRepository(session)
    uc = UpdateRuntimeProfileUseCase(repo)
    
    try:
        profile = await uc.execute(
            profile_id=profile_id,
            name=data.name,
            display_name=data.display_name,
            description=data.description,
            docker_image=data.docker_image,
            docker_image_tag=data.docker_image_tag,
            python_version=data.python_version,
            cuda_version=data.cuda_version,
            allowed_packages_json=data.allowed_packages_json,
            cpu_limit=data.cpu_limit,
            memory_limit_mb=data.memory_limit_mb,
            gpu_enabled=data.gpu_enabled,
            gpu_limit=data.gpu_limit,
            timeout_seconds=data.timeout_seconds,
            pids_limit=data.pids_limit,
            is_active=data.is_active,
        )
        await session.commit()
        return RuntimeProfileResponse.model_validate(profile)
    except ValueError as e:
        await session.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.patch("/{profile_id}/toggle", response_model=RuntimeProfileResponse, dependencies=[Depends(require_admin)])
async def toggle_runtime_profile(
    profile_id: UUID,
    data: ToggleRuntimeProfileRequest,
    session: AsyncSession = Depends(get_session),
    _current_user: dict = Depends(get_current_user),
):
    """
    Admin: Enable or disable a runtime profile.
    """
    repo = RuntimeProfileRepository(session)
    uc = ToggleRuntimeProfileUseCase(repo)
    
    try:
        profile = await uc.execute(profile_id, data.is_active)
        await session.commit()
        return RuntimeProfileResponse.model_validate(profile)
    except ValueError as e:
        await session.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{profile_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_admin)])
async def delete_runtime_profile(
    profile_id: UUID,
    session: AsyncSession = Depends(get_session),
    _current_user: dict = Depends(get_current_user),
):
    """
    Admin: Delete a runtime profile.
    Note: Will fail if there are submissions using this profile.
    """
    repo = RuntimeProfileRepository(session)
    uc = DeleteRuntimeProfileUseCase(repo)
    
    try:
        await uc.execute(profile_id)
        await session.commit()
    except ValueError as e:
        await session.rollback()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
