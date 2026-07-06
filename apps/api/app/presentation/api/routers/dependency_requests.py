"""
API Router for Dependency Request management
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.use_cases.dependency_requests import (
    ApproveDependencyRequestUseCase,
    CreateDependencyRequestUseCase,
    GetDependencyRequestUseCase,
    ListAllDependencyRequestsUseCase,
    ListUserDependencyRequestsUseCase,
    RejectDependencyRequestUseCase,
)
from app.infrastructure.database import get_session
from app.infrastructure.repositories.dependency_requests import DependencyRequestRepository
from app.presentation.api.dependencies import get_current_user, require_admin
from app.presentation.api.deps import UserContext
from app.presentation.schemas.dependency_requests import (
    ApproveDependencyRequestRequest,
    DependencyRequestCreate,
    DependencyRequestListResponse,
    DependencyRequestResponse,
    RejectDependencyRequestRequest,
)

router = APIRouter(prefix="/dependency-requests", tags=["Dependency Requests"])


@router.post(
    "",
    response_model=DependencyRequestResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_dependency_request(
    data: DependencyRequestCreate,
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user),
):
    """
    User creates a dependency request to add a package to runtime environment.
    This is a request only. Admin must approve before package is available.
    """
    repo = DependencyRequestRepository(session)
    uc = CreateDependencyRequestUseCase(repo)

    try:
        request = await uc.execute(
            hackathon_id=data.hackathon_id,
            user_id=current_user["user_id"],
            package_name=data.package_name,
            package_version=data.package_version,
            reason=data.reason,
            task_id=data.task_id,
            team_id=data.team_id,
        )
        await session.commit()
        return DependencyRequestResponse.model_validate(request)
    except ValueError as e:
        await session.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/me", response_model=DependencyRequestListResponse)
async def list_my_dependency_requests(
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user),
):
    """
    User lists all dependency requests created by current user.
    """
    repo = DependencyRequestRepository(session)
    uc = ListUserDependencyRequestsUseCase(repo)

    requests = await uc.execute(current_user["user_id"])

    return DependencyRequestListResponse(
        requests=[DependencyRequestResponse.model_validate(r) for r in requests],
        total=len(requests),
    )


@router.get("", response_model=DependencyRequestListResponse)
async def list_all_dependency_requests(
    pending_only: bool = False,
    session: AsyncSession = Depends(get_session),
    admin_user: UserContext = Depends(require_admin),
):
    """
    Admin lists all dependency requests.
    Query param pending_only=true filters only pending requests.
    """
    repo = DependencyRequestRepository(session)
    uc = ListAllDependencyRequestsUseCase(repo)

    requests = await uc.execute(pending_only=pending_only)

    return DependencyRequestListResponse(
        requests=[DependencyRequestResponse.model_validate(r) for r in requests],
        total=len(requests),
    )


@router.get("/{request_id}", response_model=DependencyRequestResponse)
async def get_dependency_request(
    request_id: UUID,
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user),
):
    """
    Users can only see their own requests.
    Admin can see all requests.
    """
    repo = DependencyRequestRepository(session)
    uc = GetDependencyRequestUseCase(repo)

    try:
        request = await uc.execute(request_id)

        is_admin = current_user.get("quiz_role") == "admin"
        if not is_admin and request.user_id != current_user["user_id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view your own requests",
            )

        return DependencyRequestResponse.model_validate(request)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.patch("/{request_id}/approve", response_model=DependencyRequestResponse)
async def approve_dependency_request(
    request_id: UUID,
    data: ApproveDependencyRequestRequest,
    session: AsyncSession = Depends(get_session),
    admin_user: UserContext = Depends(require_admin),
):
    """
    Admin approves a dependency request.
    """
    repo = DependencyRequestRepository(session)
    uc = ApproveDependencyRequestUseCase(repo)

    try:
        request = await uc.execute(
            request_id=request_id,
            admin_id=admin_user.id,
            admin_note=data.admin_note,
        )
        await session.commit()
        return DependencyRequestResponse.model_validate(request)
    except ValueError as e:
        await session.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.patch("/{request_id}/reject", response_model=DependencyRequestResponse)
async def reject_dependency_request(
    request_id: UUID,
    data: RejectDependencyRequestRequest,
    session: AsyncSession = Depends(get_session),
    admin_user: UserContext = Depends(require_admin),
):
    """
    Admin rejects a dependency request with a reason.
    """
    repo = DependencyRequestRepository(session)
    uc = RejectDependencyRequestUseCase(repo)

    try:
        request = await uc.execute(
            request_id=request_id,
            admin_id=admin_user.id,
            admin_note=data.admin_note,
        )
        await session.commit()
        return DependencyRequestResponse.model_validate(request)
    except ValueError as e:
        await session.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))