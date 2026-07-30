from fastapi import APIRouter, UploadFile, File, Form, status, HTTPException
from dishka.integrations.fastapi import FromDishka, inject
from app.presentation.api.deps import CurrentUser
from app.presentation.schemas.pdf_import import StartPdfImportResponse
from app.application.use_cases.questions.start_pdf_import_uc import StartPdfImportUseCase

router = APIRouter(prefix="/questions", tags=["questions"])

@router.post(
    "/import-pdf", 
    response_model=StartPdfImportResponse, 
    status_code=status.HTTP_202_ACCEPTED
)
@inject
async def import_pdf_route(
    user: CurrentUser,
    use_case: FromDishka[StartPdfImportUseCase],
    file: UploadFile = File(...),
    target_scope: str | None = Form(None),
    password: str | None = Form(None),
):
    pdf_bytes = await file.read()
    try:
        return await use_case.execute(
            user_id=user.id,
            pdf_bytes=pdf_bytes,
            file_name=file.filename,
            target_scope=target_scope,
            password=password
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, 
            detail={"error": str(e)}
        )
