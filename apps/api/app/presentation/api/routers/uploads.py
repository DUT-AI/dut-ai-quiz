from dishka.integrations.fastapi import FromDishka, inject
from fastapi import APIRouter

from app.application.use_cases.uploads.presign_upload import PresignUploadUseCase
from app.presentation.api.deps import CurrentUser, SessionDep
from app.presentation.schemas.attempts import PresignBody

router = APIRouter(prefix="/uploads", tags=["uploads"])


@router.post("/presign")
@inject
async def presign(
    session: SessionDep,
    user: CurrentUser,
    body: PresignBody,
    use_case: FromDishka[PresignUploadUseCase],
):
    return await use_case(key=body.key, content_type=body.content_type)
