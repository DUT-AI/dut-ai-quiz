"""
PDF AI Parser Service — Vision LLM OCR với Gemini 2.0 Flash.

Pipeline:
  1. Validate PDF (kích thước, số trang, mã hóa)
  2. Render từng trang thành ảnh PNG → crop hình vẽ inline ≥ 80×80px
  3. Upload ảnh crop lên MinIO
  4. Gọi Gemini multimodal API để phân tích bố cục + trích xuất câu hỏi
  5. Tính duplicate similarity (cosine) với câu hỏi hiện có
"""
from __future__ import annotations

import io
import json
import re
import uuid
from dataclasses import dataclass, field
from typing import Any

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


@dataclass
class PDFValidationResult:
    ok: bool
    error: str | None = None
    is_encrypted: bool = False


# ---------------------------------------------------------------------------
# Gemini Prompt
# ---------------------------------------------------------------------------

EXTRACTION_PROMPT = """Bạn là một AI chuyên phân tích đề thi trắc nghiệm tiếng Việt.

Hãy phân tích toàn bộ nội dung trong ảnh trang PDF này và trích xuất TẤT CẢ câu hỏi trắc nghiệm.

YÊU CẦU ĐẦU RA:
Trả về JSON (không có markdown code block, chỉ JSON thuần) theo cấu trúc sau:
{
  "questions": [
    {
      "content": "Nội dung câu hỏi (đầy đủ, không bao gồm số thứ tự như Câu 1.)",
      "options": [
        {"id": "A", "text": "Nội dung đáp án A", "is_correct": false},
        {"id": "B", "text": "Nội dung đáp án B", "is_correct": true},
        {"id": "C", "text": "Nội dung đáp án C", "is_correct": false},
        {"id": "D", "text": "Nội dung đáp án D", "is_correct": false}
      ],
      "solution": "Lời giải chi tiết từng bước (nếu không có trong đề thì tự sinh)",
      "difficulty": "EASY|MEDIUM|HARD",
      "is_answer_ai_generated": false,
      "is_solution_ai_generated": false,
      "is_difficulty_ai_suggested": true
    }
  ]
}

QUY TẮC:
1. Nếu đề đã có đáp án → trích xuất nguyên, set is_answer_ai_generated = false
2. Nếu đề KHÔNG có đáp án → AI tự xác định đáp án đúng, set is_answer_ai_generated = true
3. Nếu đề đã có lời giải → trích xuất nguyên, set is_solution_ai_generated = false
4. Nếu đề KHÔNG có lời giải → AI tự sinh lời giải chi tiết từng bước, set is_solution_ai_generated = true
5. Độ khó: EASY (nhận biết/thông hiểu cơ bản), MEDIUM (vận dụng), HARD (vận dụng cao)
6. Nếu câu hỏi có hình vẽ/đồ thị → ghi chú "[Hình vẽ đính kèm]" vào đầu content
7. Bỏ qua header, footer, số trang — chỉ lấy câu hỏi trắc nghiệm
8. Giữ nguyên ký hiệu toán học (LaTeX nếu có)
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

Trả về chỉ nội dung lời giải, không cần JSON.
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

    # ------------------------------------------------------------------
    # STEP 1: Validate PDF
    # ------------------------------------------------------------------

    def validate_pdf(self, pdf_bytes: bytes, file_name: str) -> PDFValidationResult:
        """Kiểm tra kích thước, số trang và mã hóa PDF."""
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

        pages = len(doc)
        doc.close()

        if pages > settings.pdf_max_pages:
            return PDFValidationResult(
                ok=False,
                error=f"PDF có {pages} trang (tối đa {settings.pdf_max_pages} trang)",
            )

        return PDFValidationResult(ok=True)

    def try_decrypt_pdf(self, pdf_bytes: bytes, password: str) -> bytes | None:
        """Thử giải mã PDF bằng mật khẩu. Trả về bytes đã mở hoặc None nếu sai."""
        try:
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            if doc.is_encrypted:
                success = doc.authenticate(password)
                if not success:
                    doc.close()
                    return None
            # Re-save as decrypted
            buf = io.BytesIO()
            doc.save(buf)
            doc.close()
            return buf.getvalue()
        except Exception:
            return None

    # ------------------------------------------------------------------
    # STEP 2+3: Render pages → crop images → upload MinIO
    # ------------------------------------------------------------------

    def _render_page_as_image(self, page: fitz.Page, dpi: int = 150) -> bytes:
        """Render PDF page thành ảnh PNG bytes."""
        mat = fitz.Matrix(dpi / 72, dpi / 72)
        pix = page.get_pixmap(matrix=mat, alpha=False)
        return pix.tobytes("png")

    def _crop_inline_images(
        self, page: fitz.Page, job_id: str
    ) -> list[tuple[str, bytes]]:
        """
        Crop các hình ảnh inline (đồ thị, sơ đồ) từ page.
        Bỏ qua ảnh nhỏ hơn pdf_image_min_px × pdf_image_min_px.
        Trả về list của (anchor_id, image_bytes).
        """
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
        """Upload ảnh lên MinIO, trả về public URL."""
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

    async def analyze_page_with_gemini(
        self, page_image_bytes: bytes, context_images: list[tuple[str, str]]
    ) -> list[dict[str, Any]]:
        """
        Gọi Gemini 2.0 Flash với ảnh trang PDF để trích xuất câu hỏi.
        context_images: list của (anchor_id, minio_url) cho ảnh inline đã upload.
        """
        # Build prompt với context về ảnh inline
        prompt = EXTRACTION_PROMPT
        if context_images:
            anchors = "\n".join(
                f"- [[{aid}]] → {url}" for aid, url in context_images
            )
            prompt += f"\n\nCHÚ Ý: Trang này có các hình ảnh đính kèm:\n{anchors}\nKhi gặp hình vẽ trong câu hỏi, hãy thêm '[[{context_images[0][0]}]]' vào content."

        # Build Gemini content parts
        parts: list[Any] = [
            genai_types.Part.from_bytes(
                data=page_image_bytes,
                mime_type="image/png",
            ),
            prompt,
        ]

        try:
            response = await self._client.aio.models.generate_content(
                model=settings.gemini_model,
                contents=parts,
                config=genai_types.GenerateContentConfig(
                    temperature=0.1,
                    max_output_tokens=8192,
                ),
            )
            raw_text = response.text.strip()

            # Strip markdown code blocks if Gemini wraps output
            raw_text = re.sub(r"^```(?:json)?\s*", "", raw_text)
            raw_text = re.sub(r"\s*```$", "", raw_text)

            data = json.loads(raw_text)
            return data.get("questions", [])

        except json.JSONDecodeError as exc:
            logger.error(f"Gemini returned non-JSON: {exc}\nRaw: {raw_text[:500]}")
            return []
        except Exception as exc:
            logger.error(f"Gemini API error: {exc}")
            return []

    # ------------------------------------------------------------------
    # STEP 5: Full pipeline — parse one PDF
    # ------------------------------------------------------------------

    async def parse_pdf_with_ai(
        self, pdf_bytes: bytes, job_id: str
    ) -> list[ParsedQuestion]:
        """
        Chạy toàn bộ pipeline Vision OCR cho một file PDF.
        Trả về list ParsedQuestion đã được AI phân tích.
        """
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        all_questions: list[ParsedQuestion] = []

        for page_num, page in enumerate(doc):
            logger.info(f"[PDF Import job={job_id}] Processing page {page_num + 1}/{len(doc)}")

            # Render page as image
            page_img_bytes = self._render_page_as_image(page)

            # Crop inline images
            inline_images = self._crop_inline_images(page, job_id)
            minio_refs: list[tuple[str, str]] = []
            for anchor_id, img_bytes in inline_images:
                try:
                    url = self._upload_image_to_minio(job_id, anchor_id, img_bytes)
                    minio_refs.append((anchor_id, url))
                    logger.info(f"  Uploaded inline image {anchor_id} → {url}")
                except Exception as exc:
                    logger.warning(f"  Failed to upload {anchor_id}: {exc}")

            # Call Gemini
            raw_questions = await self.analyze_page_with_gemini(
                page_img_bytes, minio_refs
            )

            # Map raw dicts to ParsedQuestion
            for q in raw_questions:
                options = [
                    ParsedOption(
                        id=opt.get("id", "A"),
                        text=opt.get("text", ""),
                        is_correct=bool(opt.get("is_correct", False)),
                        fixed=bool(opt.get("fixed", False)),
                    )
                    for opt in q.get("options", [])
                ]
                # Attach MinIO image URLs to question if page had inline images
                img_urls = [url for _, url in minio_refs]

                pq = ParsedQuestion(
                    content=q.get("content", ""),
                    options=options,
                    solution=q.get("solution"),
                    difficulty=q.get("difficulty", "MEDIUM"),
                    is_answer_ai_generated=bool(q.get("is_answer_ai_generated", False)),
                    is_solution_ai_generated=bool(q.get("is_solution_ai_generated", False)),
                    is_difficulty_ai_suggested=bool(q.get("is_difficulty_ai_suggested", True)),
                    image_urls=img_urls,
                )
                if pq.content:
                    all_questions.append(pq)

        doc.close()
        logger.info(f"[PDF Import job={job_id}] Extracted {len(all_questions)} questions total")
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
        """Gọi Gemini để sinh lại lời giải chi tiết cho một câu hỏi."""
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
            return response.text.strip()
        except Exception as exc:
            logger.error(f"Gemini regenerate_solution error: {exc}")
            raise RuntimeError(f"AI không thể sinh lời giải: {exc}") from exc
