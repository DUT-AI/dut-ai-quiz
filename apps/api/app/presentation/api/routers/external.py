from fastapi import APIRouter
from dishka.integrations.fastapi import FromDishka, inject
from app.presentation.api.deps import AdminOrMentorUser
from app.domain.interfaces import IManageService

router = APIRouter(prefix="/external", tags=["external"])


@router.get("/teams")
@inject
async def get_external_teams(
    user: AdminOrMentorUser,
    manage_service: FromDishka[IManageService],
):
    return await manage_service.get_teams()


@router.get("/users")
@inject
async def get_external_users(
    user: AdminOrMentorUser,
    manage_service: FromDishka[IManageService],
):
    return await manage_service.get_users()
