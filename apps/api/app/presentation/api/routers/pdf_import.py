from fastapi import APIRouter, UploadFile, File, Form
from dishka.integrations.fastapi import FromDishka, inject
from app.application.services.pdf_parser import PDFParserService
from app.presentation.api.deps import CurrentUser
from app.presentation.schemas.pdf_import import PDFParseResponse, PDFImportRequest

router = APIRouter(prefix="/questions", tags=["questions"])

@router.post("/parse-pdf", response_model=PDFParseResponse)
@inject
async def parse_pdf_route(
    user: CurrentUser,
    file: UploadFile = File(...),
    question_delimiter: str = Form(r"Câu \d+[:.]"),
    option_prefixes: str = Form("A,B,C,D"),
    correct_answer_marker: str = Form(""),
    parser: FromDishka[PDFParserService] = None,
):
    pdf_bytes = await file.read()
    request = PDFImportRequest(
        question_delimiter=question_delimiter,
        option_prefixes=option_prefixes,
        correct_answer_marker=correct_answer_marker
    )
    return parser.parse_pdf(pdf_bytes, request)
