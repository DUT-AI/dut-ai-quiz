"""
PDF AI Parser Service — Vision LLM OCR với Gemini Flash (Structured JSON Mode).
"""
from __future__ import annotations

import asyncio
import io
import json
import re
import uuid
from dataclasses import dataclass, field
from typing import Any

from pydantic import BaseModel, Field

import fitz  # PyMuPDF
from google import genai
from google.genai import types as genai_types
from loguru import logger

from app.config import settings
from app.domain.interfaces.s3_client import IS3Client


# ---------------------------------------------------------------------------
# Data Transfer Objects (internal)
# ---------------------------------------------------------------------------

@dataclass
class ParsedOption:
    id: str          # "A", "B", "C", "D"
    text: str
    is_correct: bool
    fixed: bool = False


@dataclass
class ParsedQuestion:
    content: str
    options: list[ParsedOption] = field(default_factory=list)
    solution: str | None = None
    difficulty: str = "MEDIUM"
    is_answer_ai_generated: bool = False
    is_solution_ai_generated: bool = False
    is_difficulty_ai_suggested: bool = True
    image_urls: list[str] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Data Transfer Objects (Pydantic Models cho Gemini Structured Output)
# ---------------------------------------------------------------------------

class GeminiParsedOption(BaseModel):
    id: str = Field(description='"A", "B", "C", "D"')
    text: str = Field(description="Nội dung đáp án")
    is_correct: bool = Field(description="True nếu là đáp án đúng")
    fixed: bool = False

class GeminiParsedQuestion(BaseModel):
    content: str = Field(description="Nội dung câu hỏi (không bao gồm 'Câu X')")
    options: list[GeminiParsedOption] = Field(description="Danh sách 4 đáp án")
    solution: str | None = Field(default=None, description="Lời giải chi tiết từng bước")
    difficulty: str = Field(default="MEDIUM", description="EASY, MEDIUM, hoặc HARD")
    is_answer_ai_generated: bool = False
    is_solution_ai_generated: bool = False
    is_difficulty_ai_suggested: bool = True

class ExtractionResponse(BaseModel):
    questions: list[GeminiParsedQuestion]

@dataclass
class PDFValidationResult:
    ok: bool
    error: str | None = None
    is_encrypted: bool = False



# ---------------------------------------------------------------------------
# Gemini Prompt
# ---------------------------------------------------------------------------

EXTRACTION_PROMPT = """Bạn là một AI chuyên phân tích và bóc tách đề thi trắc nghiệm tiếng Việt.
Nhiệm vụ của bạn là đọc toàn bộ hình ảnh trang PDF này và trích xuất TẤT CẢ các câu hỏi trắc nghiệm bạn nhìn thấy.

YÊU CẦU ĐẦU RA (ĐỊNH DẠNG JSON):
{
  "questions": [
    {
      "content": "Nội dung câu hỏi (đầy đủ, giữ nguyên định dạng, không bao gồm chữ 'Câu X:')",
      "options": [
        {"id": "A", "text": "Nội dung đáp án A", "is_correct": false},
        {"id": "B", "text": "Nội dung đáp án B", "is_correct": true},
        {"id": "C", "text": "Nội dung đáp án C", "is_correct": false},
        {"id": "D", "text": "Nội dung đáp án D", "is_correct": false}
      ],
      "solution": "Lời giải chi tiết từng bước (nếu không có trong đề thì tự phân tích và viết ra)",
      "difficulty": "EASY|MEDIUM|HARD",
      "is_answer_ai_generated": false,
      "is_solution_ai_generated": false,
      "is_difficulty_ai_suggested": true
    }
  ]
}

QUY TẮC BẮT BUỘC (TUYỆT ĐỐI KHÔNG BỎ SÓT):
1. Câu hỏi thường bắt đầu bằng các từ khóa như "Câu 1", "Câu 2", "Bài 1"... Hãy dò tìm thật kỹ.
2. Dù định dạng PDF có lộn xộn hay mờ, hãy cố gắng hết sức để nhận diện và đọc văn bản.
3. Nếu đề không đánh dấu đáp án đúng, bạn PHẢI tự giải và đánh dấu is_correct = true cho 1 đáp án, đồng thời set is_answer_ai_generated = true.
4. Nếu đề không có lời giải, bạn PHẢI tự sinh lời giải chi tiết, set is_solution_ai_generated = true.
5. Giữ nguyên toàn bộ ký hiệu toán học (dùng LaTeX nếu cần thiết).
6. Chỉ bỏ qua phần Header (tiêu đề trường/lớp) và Footer (số trang). Phải lấy toàn bộ các câu hỏi.
"""

REGENERATE_SOLUTION_PROMPT = """Bạn là một giáo viên giỏi. Hãy giải chi tiết câu hỏi trắc nghiệm sau:

Câu hỏi: {content}

Các đáp án:
{options_text}

Đáp án đúng: {correct_answer}

{admin_hint}

Yêu cầu:
- Giải thích TẠI SAO đáp án đúng là chính xác
- Giải thích tại sao các đáp án sai là sai
- Trình bày theo từng bước rõ ràng
- Dùng tiếng Việt, ngắn gọn nhưng đầy đủ

Trả về chỉ nội dung lời giải.
"""


# ---------------------------------------------------------------------------
# Service
# ---------------------------------------------------------------------------

class PDFAIParserService:
    """
    Core service thực hiện pipeline Vision LLM OCR để import PDF câu hỏi.
    """

    def __init__(self, s3_client: IS3Client) -> None:
        self._s3 = s3_client
        self._client = genai.Client(api_key=settings.gemini_api_key)
        self._gemini_semaphore = asyncio.Semaphore(2)

    # ------------------------------------------------------------------
    # STEP 1: Validate PDF
    # ------------------------------------------------------------------

    def validate_pdf(self, pdf_bytes: bytes, file_name: str) -> PDFValidationResult:
        size_mb = len(pdf_bytes) / (1024 * 1024)
        if size_mb > settings.pdf_max_size_mb:
            return PDFValidationResult(
                ok=False,
                error=f"File quá lớn: {size_mb:.1f}MB (tối đa {settings.pdf_max_size_mb}MB)",
            )

        try:
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        except Exception as exc:
            return PDFValidationResult(ok=False, error=f"File PDF không hợp lệ: {exc}")

        if doc.is_encrypted:
            doc.close()
            return PDFValidationResult(ok=False, error="PDF_LOCKED", is_encrypted=True)

        doc.close()
        return PDFValidationResult(ok=True)

    def try_decrypt_pdf(self, pdf_bytes: bytes, password: str) -> bytes | None:
        try:
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            if doc.is_encrypted:
                success = doc.authenticate(password)
                if not success:
                    doc.close()
                    return None
            buf = io.BytesIO()
            doc.save(buf)
            doc.close()
            return buf.getvalue()
        except Exception:
            return None

    # ------------------------------------------------------------------
    # STEP 2+3: Render pages → crop images → upload MinIO
    # ------------------------------------------------------------------

    def _render_page_as_image(self, page: fitz.Page, dpi: int = 300) -> bytes:
        mat = fitz.Matrix(dpi / 72, dpi / 72)
        pix = page.get_pixmap(matrix=mat, alpha=False)
        return pix.tobytes("png")

    def _crop_inline_images(
        self, page: fitz.Page, job_id: str
    ) -> list[tuple[str, bytes]]:
        results: list[tuple[str, bytes]] = []
        min_px = settings.pdf_image_min_px

        for img_info in page.get_images(full=True):
            xref = img_info[0]
            try:
                base_image = page.parent.extract_image(xref)
                img_bytes = base_image["image"]
                width = base_image.get("width", 0)
                height = base_image.get("height", 0)
                if width < min_px or height < min_px:
                    continue
                anchor_id = f"IMG_{uuid.uuid4().hex[:8].upper()}"
                results.append((anchor_id, img_bytes))
            except Exception as exc:
                logger.warning(f"Failed to extract image xref={xref}: {exc}")

        return results

    def _upload_image_to_minio(
        self, job_id: str, anchor_id: str, img_bytes: bytes
    ) -> str:
        key = f"{settings.pdf_images_prefix}/{job_id}/{anchor_id}.png"
        self._s3.upload_fileobj(
            io.BytesIO(img_bytes),
            settings.pdf_upload_bucket,
            key,
        )
        url = self._s3.get_object_url(settings.pdf_upload_bucket, key)
        return url

    # ------------------------------------------------------------------
    # STEP 4+5: Call Gemini Vision API
    # ------------------------------------------------------------------

    async def analyze_batch_with_gemini(
        self,
        batch_page_images: list[bytes],
        batch_page_nums: list[int],
        context_images: list[tuple[str, str]],
    ) -> list[dict[str, Any]]:
        prompt = EXTRACTION_PROMPT
        if context_images:
            anchors = "\n".join(
                f"- [[{aid}]] → {url}" for aid, url in context_images
            )
            prompt += f"\n\nCHÚ Ý: Các trang này có hình ảnh đính kèm:\n{anchors}"

        parts: list[Any] = []
        for i, img_bytes in enumerate(batch_page_images):
            parts.append(f"=== Trang {batch_page_nums[i] + 1} ===")
            parts.append(
                genai_types.Part.from_bytes(data=img_bytes, mime_type="image/png")
            )
        parts.append(prompt)

        max_retries = 4
        base_delay = 5.0

        for attempt in range(max_retries):
            try:
                async with self._gemini_semaphore:
                    response = await self._client.aio.models.generate_content(
                        model=settings.gemini_model,
                        contents=parts,
                        config=genai_types.GenerateContentConfig(
                            temperature=0.1,
                            max_output_tokens=8192,
                            response_mime_type="application/json", # Ép Gemini trả về Structured JSON
                            response_schema=ExtractionResponse,
                        ),
                    )
                raw_text = response.text.strip() if response.text else ""
                
                # Cleanup markdown codeblocks phòng trường hợp hiếm
                raw_text = re.sub(r"^```(?:json)?\s*", "", raw_text, flags=re.MULTILINE)
                raw_text = re.sub(r"\s*```$", "", raw_text, flags=re.MULTILINE)

                if not raw_text:
                    logger.warning(f"Gemini returned empty text for pages {[p+1 for p in batch_page_nums]}")
                    return []

                data = json.loads(raw_text)

                # Linh hoạt trích xuất câu hỏi từ Dict hoặc List
                raw_questions = []
                if isinstance(data, list):
                    raw_questions = data
                elif isinstance(data, dict):
                    raw_questions = (
                        data.get("questions") 
                        or data.get("items") 
                        or data.get("data") 
                        or []
                    )

                if not raw_questions:
                    logger.warning(
                        f"[Debug Gemini Output] Pages {[p+1 for p in batch_page_nums]} "
                        f"returned 0 questions. Raw text excerpt: {raw_text[:300]}"
                    )

                return raw_questions

            except json.JSONDecodeError as exc:
                logger.error(f"Gemini batch JSON parse error: {exc}\nRaw output: {raw_text[:500]}")
                return []
            except Exception as exc:
                err_str = str(exc)
                if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                    if attempt < max_retries - 1:
                        m = re.search(r"retry in (\d+(?:\.\d+)?)s", err_str)
                        wait = float(m.group(1)) if m else base_delay * (2 ** attempt)
                        wait = min(wait, 120)
                        logger.warning(
                            f"Gemini 429 Rate Limit — pages={[p+1 for p in batch_page_nums]}, "
                            f"retry {attempt+1}/{max_retries-1} sau {wait:.0f}s"
                        )
                        await asyncio.sleep(wait)
                        continue
                logger.error(f"Gemini batch API error: {exc}")
                return []

        logger.error(f"Gemini batch failed sau {max_retries} lần retry")
        return []

    async def analyze_page_with_gemini(
        self,
        page_image_bytes: bytes,
        context_images: list[tuple[str, str]],
    ) -> list[dict[str, Any]]:
        return await self.analyze_batch_with_gemini(
            batch_page_images=[page_image_bytes],
            batch_page_nums=[0],
            context_images=context_images,
        )

    # ------------------------------------------------------------------
    # STEP 5: Full pipeline — parse one PDF
    # ------------------------------------------------------------------

    async def parse_pdf_with_ai(
        self,
        pdf_bytes: bytes,
        job_id: str,
        batch_size: int = 3,
    ) -> list[ParsedQuestion]:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        total_pages = len(doc)
        logger.info(f"[PDF Import job={job_id}] Total {total_pages} pages, batch_size={batch_size}")

        rendered: list[tuple[int, bytes, list[tuple[str, str]]]] = []
        for page_num in range(total_pages):
            page = doc[page_num]
            page_img = self._render_page_as_image(page)

            inline_images = self._crop_inline_images(page, job_id)
            minio_refs: list[tuple[str, str]] = []
            for anchor_id, img_bytes in inline_images:
                try:
                    url = self._upload_image_to_minio(job_id, anchor_id, img_bytes)
                    minio_refs.append((anchor_id, url))
                    logger.info(f"  Uploaded inline image {anchor_id} → {url}")
                except Exception as exc:
                    logger.warning(f"  Failed to upload {anchor_id}: {exc}")

            rendered.append((page_num, page_img, minio_refs))

        doc.close()

        batches: list[list[tuple[int, bytes, list[tuple[str, str]]]]] = [
            rendered[i : i + batch_size]
            for i in range(0, total_pages, batch_size)
        ]
        logger.info(f"[PDF Import job={job_id}] {len(batches)} batches to process")

        async def process_batch(
            batch: list[tuple[int, bytes, list[tuple[str, str]]]],
            batch_idx: int,
        ) -> list[ParsedQuestion]:
            page_nums = [item[0] for item in batch]
            page_images = [item[1] for item in batch]
            all_refs: list[tuple[str, str]] = []
            for item in batch:
                all_refs.extend(item[2])

            logger.info(
                f"[PDF Import job={job_id}] Batch {batch_idx + 1}/{len(batches)} "
                f"— pages {[p + 1 for p in page_nums]}"
            )

            raw_questions = await self.analyze_batch_with_gemini(
                batch_page_images=page_images,
                batch_page_nums=page_nums,
                context_images=all_refs,
            )

            batch_questions: list[ParsedQuestion] = []
            for q in raw_questions:
                if not isinstance(q, dict):
                    continue
                options = [
                    ParsedOption(
                        id=opt.get("id", "A"),
                        text=opt.get("text", ""),
                        is_correct=bool(opt.get("is_correct", False)),
                        fixed=bool(opt.get("fixed", False)),
                    )
                    for opt in q.get("options", []) if isinstance(opt, dict)
                ]
                
                pq = ParsedQuestion(
                    content=q.get("content", ""),
                    options=options,
                    solution=q.get("solution"),
                    difficulty=q.get("difficulty", "MEDIUM"),
                    is_answer_ai_generated=bool(q.get("is_answer_ai_generated", False)),
                    is_solution_ai_generated=bool(q.get("is_solution_ai_generated", False)),
                    is_difficulty_ai_suggested=bool(q.get("is_difficulty_ai_suggested", True)),
                    image_urls=[url for _, url in all_refs],
                )
                
                if pq.content:
                    batch_questions.append(pq)
            return batch_questions



        results = await asyncio.gather(
            *[process_batch(batch, idx) for idx, batch in enumerate(batches)],
            return_exceptions=False,
        )

        all_questions: list[ParsedQuestion] = []
        for batch_result in results:
            all_questions.extend(batch_result)

        logger.info(
            f"[PDF Import job={job_id}] Completed — "
            f"{len(all_questions)} questions from {total_pages} pages"
        )
        return all_questions

    # ------------------------------------------------------------------
    # AI Regenerate Solution for a single question
    # ------------------------------------------------------------------

    async def regenerate_solution(
        self,
        content: str,
        options: list[dict[str, Any]],
        admin_hint: str = "",
    ) -> str:
        correct_opt = next(
            (o for o in options if o.get("is_correct")), None
        )
        correct_text = (
            f"{correct_opt['id']}. {correct_opt['text']}"
            if correct_opt
            else "Chưa xác định"
        )
        options_text = "\n".join(
            f"{o['id']}. {o['text']}" for o in options
        )
        hint_block = f"\nGợi ý từ admin: {admin_hint}" if admin_hint else ""

        prompt = REGENERATE_SOLUTION_PROMPT.format(
            content=content,
            options_text=options_text,
            correct_answer=correct_text,
            admin_hint=hint_block,
        )

        try:
            response = await self._client.aio.models.generate_content(
                model=settings.gemini_model,
                contents=prompt,
                config=genai_types.GenerateContentConfig(
                    temperature=0.3,
                    max_output_tokens=2048,
                ),
            )
            return response.text.strip() if response.text else ""
        except Exception as exc:
            logger.error(f"Gemini regenerate_solution error: {exc}")
            raise RuntimeError(f"AI không thể sinh lời giải: {exc}") from exc
