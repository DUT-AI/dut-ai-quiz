import os
import json
import time
from loguru import logger
from google import genai
from app.domain.interfaces.pdf_parser_strategy import IPdfParserStrategy
from app.presentation.schemas.pdf_import import ParsedQuestionPreview
from app.presentation.schemas.questions import QuestionOptionIn
import tempfile
import opendataloader_pdf
import re
from paddleocr import PaddleOCR
from app.config import settings

from pydantic import BaseModel

from PIL import Image
class OptionSchema(BaseModel):
    id: str
    text: str
    is_correct: bool


class QuestionSchema(BaseModel):
    content: str
    options: list[OptionSchema]
    solution: str


class AIPdfParserStrategy(IPdfParserStrategy):
    """
    V2 Pipeline Strategy using OpenDataLoader for layout parsing
    and Gemini Multimodal API for cognitive processing.
    """

    async def parse(
        self, pdf_bytes: bytes, password: str | None = None, **kwargs
    ) -> list[ParsedQuestionPreview]:
        job_id = kwargs.get("job_id", "temp_job")

        logger.info(f"[{job_id}] STARTING AI PDF PARSER...")
        total_start_time = time.time()

        # We need a temp file for opendataloader
        with tempfile.TemporaryDirectory() as tmpdir:
            input_pdf = os.path.join(tmpdir, f"{job_id}.pdf")
            with open(input_pdf, "wb") as f:
                f.write(pdf_bytes)

            image_dir = os.path.join(tmpdir, "images")
            os.makedirs(image_dir, exist_ok=True)

            logger.info(
                f"[{job_id}] ⏳ STEP 1: Running OpenDataLoader (Layout & Image Extraction)..."
            )
            odl_start = time.time()
            # Use OpenDataLoader to convert to markdown and extract images
            opendataloader_pdf.convert(
                input_path=input_pdf,
                output_dir=tmpdir,
                password=password,
                format="markdown",
                image_output="external",
                image_dir=image_dir,
                quiet=True,
            )

            output_md = os.path.join(tmpdir, f"{job_id}.md")
            if os.path.exists(output_md):
                with open(output_md, "r", encoding="utf-8") as f:
                    markdown_text = f.read()
            else:
                markdown_text = ""

            logger.info(
                f"[{job_id}] ✅ OpenDataLoader finished in {time.time() - odl_start:.2f}s. Markdown length: {len(markdown_text)} chars."
            )

            # Dictionary to hold PIL images for Gemini Multimodal
            gemini_images = []

            if os.path.exists(image_dir):
                for img_file in os.listdir(image_dir):
                    if img_file.lower().endswith((".png", ".jpg", ".jpeg")):
                        img_path = os.path.join(image_dir, img_file)
                        try:
                            img = Image.open(img_path).copy()
                            gemini_images.append(img)
                        except Exception as e:
                            logger.error(
                                f"[{job_id}] Failed to load image for Gemini: {e}"
                            )

                logger.info(
                    f"[{job_id}] ✅ STEP 2: Digital PDF detected. Skipping OCR. Loaded {len(gemini_images)} images for Gemini."
                )

            if not markdown_text.strip():
                logger.error(f"[{job_id}] Failed to extract any text!")
                markdown_text = "Failed to extract text."

        # 2. STEP 4: MinIO Asset Deployment
        # In real code, we would inject IS3Client here and upload the images.
        # for img_uuid, img_bytes in images.items():
        #     url = await minio_client.upload(img_bytes, f"uploads/{job_id}/{img_uuid}.png")
        #     markdown_text = markdown_text.replace(f"[[ANCHOR_{img_uuid}]]", f"![image]({url})")

        # 3. STEP 5: Gemini Multimodal Context

        api_key = settings.gemini_api_key
        if not api_key:
            logger.warning(
                f"[{job_id}] GEMINI_API_KEY is not set in settings. Skipping AI extraction."
            )
            return []  # Safely return empty if no key

        try:
            client = genai.Client(api_key=api_key.strip())
            prompt = (
                "You are an expert AI teacher. Extract multiple-choice questions from the following text and images.\n\n"
                "CRITICAL INSTRUCTIONS:\n"
                "1. For each question, extract its content and options. If a question has fewer than 4 options, YOU MUST automatically generate plausible and relevant distractors to ensure there are always exactly 4 options (A, B, C, D).\n"
                "2. Identify the correct answer and mark 'is_correct' as true for it.\n"
                "3. Generate a highly detailed step-by-step solution. The solution MUST:\n"
                "   - Explain the theory and concepts behind the question clearly.\n"
                "   - Show detailed calculation steps if it involves math or logic.\n"
                "   - Explicitly explain WHY the correct option is correct AND WHY the other options are incorrect.\n"
                "   - Connect and relate to other relevant domain knowledge to enrich the student's learning.\n\n"
                "Return a JSON array where each object has: "
                "'content' (string), 'options' (array of exactly 4 objects with 'id' A/B/C/D, 'text' string, 'is_correct' boolean), "
                "and 'solution' (string). "
                f"\n\nText:\n{markdown_text}"
            )

            # Combine prompt and images for Gemini Multimodal API
            gemini_contents = [prompt] + gemini_images

            model_name = "gemma-4-31b-it"

            logger.info(
                f"[{job_id}] ⏳ STEP 3: Calling AI Model ({model_name}) via API..."
            )
            gemini_start = time.time()

            # Use gemini-2.5-flash or gemma4 depending on config
            response = client.models.generate_content(
                model=model_name,
                contents=gemini_contents,
                config=genai.types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=list[QuestionSchema],
                ),
            )

            logger.info(
                f"[{job_id}] ✅ AI API Call finished in {time.time() - gemini_start:.2f}s."
            )
            if not response or not response.text:
                logger.error(f"[{job_id}] AI API returned no response.")
                return []

            # Parse the JSON response
            raw_text = response.text.strip()
            # Clean markdown JSON block if present
            raw_text = re.sub(
                r"^```(?:json)?|```$", "", raw_text, flags=re.IGNORECASE | re.MULTILINE
            ).strip()

            data = json.loads(raw_text, strict=False)

            questions = []
            for item in data:
                options = []
                for opt in item.get("options", []):
                    options.append(
                        QuestionOptionIn(
                            id=opt.get("id"),
                            text=opt.get("text"),
                            is_correct=opt.get("is_correct", False),
                            fixed=False,
                        )
                    )
                questions.append(
                    ParsedQuestionPreview(
                        content=item.get("content", ""),
                        options=options,
                        solution=item.get("solution", ""),
                    )
                )

            logger.info(
                f"[{job_id}] 🎉 SUCCESS! Total time elapsed: {time.time() - total_start_time:.2f}s. Extracted {len(questions)} questions."
            )
            return questions
        except Exception as e:
            # Fallback or log error
            logger.error(f"[{job_id}] ❌ Gemini API error or parsing failed: {e}")
            return []
