from typing import Any
from fastapi import HTTPException

from app.presentation.api.deps import UserContext


def verify_resource_ownership(
    resource_owner_id: int | None,
    user: UserContext,
    resource_name: str = "Resource",
) -> None:
    """
    ABAC (Attribute-Based Access Control) ownership check:
    - Global Override: If user is ADMIN, ownership check is bypassed.
    - Otherwise: Validates that resource_owner_id == user.id.
    - Raises HTTP 403 if user is not the owner.
    """
    if user.is_admin():
        return

    if resource_owner_id is None or resource_owner_id != user.id:
        raise HTTPException(
            status_code=403,
            detail=f"Forbidden: You do not have permission to modify or delete this {resource_name} (Ownership required)",
        )


def is_resource_owner(
    resource_owner_id: int | None,
    user: UserContext,
) -> bool:
    """
    Returns True if user is ADMIN or the resource creator/owner.
    """
    if user.is_admin():
        return True
    return resource_owner_id is not None and resource_owner_id == user.id
