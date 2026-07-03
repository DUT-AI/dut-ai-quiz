from fastapi import APIRouter

from app.application.use_cases.uploads.presign_upload import execute as presign_upload
from app.presentation.api.deps import SessionDep, AdminOrMentorUser
from app.presentation.schemas.attempts import PresignBody

router = APIRouter(prefix="/uploads", tags=["uploads"])


@router.post("/presign")
async def presign(session: SessionDep, user: AdminOrMentorUser, body: PresignBody):
    return presign_upload(key=body.key, content_type=body.content_type)
