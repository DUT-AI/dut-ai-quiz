import re
import fitz
from app.presentation.schemas.pdf_import import ParsedQuestionPreview, PDFParseResponse, PDFImportRequest

class PDFParserService:
    def parse_pdf(self, pdf_bytes: bytes, request: PDFImportRequest) -> PDFParseResponse:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        
        all_lines = []
        total_pages = len(doc)
        for page in doc:
            # page.get_text("dict") provides spans with color and flags
            blocks = page.get_text("dict")["blocks"]
            for b in blocks:
                if "lines" in b:
                    for line in b["lines"]:
                        line_text = ""
                        is_red = False
                        is_underline = False
                        for span in line["spans"]:
                            text = span["text"]
                            line_text += text
                            
                            # Detect Red: Red channel high, others low
                            color = span["color"]
                            r = (color >> 16) & 255
                            g = (color >> 8) & 255
                            b_comp = color & 255
                            if r > 180 and g < 100 and b_comp < 100:
                                is_red = True
                            
                            # Flags bit 2 (value 4) is underline
                            if span["flags"] & 4:
                                is_underline = True
                        
                        all_lines.append({
                            "text": line_text,
                            "is_marked": is_red or is_underline
                        })
        doc.close()

        # Rule: Questions start with "Câu" or "Question"
        q_pattern = re.compile(rf"^\s*(Câu|Question)\s*\d+[:.]", re.IGNORECASE)
        # Rule: Options A. B. C. D. or #A. #B. ...
        option_prefixes = [p.strip() for p in request.option_prefixes.split(",")]
        prefixes_regex = "|".join(re.escape(p) for p in option_prefixes)
        opt_pattern = re.compile(rf"^\s*(#)?({prefixes_regex})[.:)]\s*(.*)$", re.IGNORECASE)

        questions_raw = []
        current_q = None

        for line in all_lines:
            text = line["text"].strip()
            if not text: continue
            
            if q_pattern.match(text):
                if current_q: questions_raw.append(current_q)
                current_q = {"lines": [line], "options": []}
            elif current_q:
                current_q["lines"].append(line)
        
        if current_q: questions_raw.append(current_q)

        parsed_questions = []
        for q_data in questions_raw:
            content_parts = []
            options = []
            is_collecting_options = False
            
            for line in q_data["lines"]:
                text = line["text"].strip()
                opt_match = opt_pattern.match(text)
                
                if opt_match:
                    is_collecting_options = True
                    is_fixed = opt_match.group(1) == "#"
                    prefix = opt_match.group(2).upper()
                    opt_text = opt_match.group(3).strip()
                    
                    # Rule: Marked red/underline means correct
                    is_correct = line["is_marked"]
                    
                    options.append({
                        "id": prefix,
                        "text": opt_text,
                        "is_correct": is_correct,
                        "fixed": is_fixed
                    })
                elif not is_collecting_options:
                    content_parts.append(line["text"])
            
            content = " ".join(content_parts).strip()
            # Clean "Câu X." prefix
            content = q_pattern.sub("", content).strip()

            if content:
                parsed_questions.append(ParsedQuestionPreview(
                    content=content,
                    options=options,
                    solution=None
                ))

        return PDFParseResponse(
            questions=parsed_questions,
            total_pages=total_pages,
            warnings=[]
        )
