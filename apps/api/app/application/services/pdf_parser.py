import re
import fitz
from app.presentation.schemas.pdf_import import ParsedQuestionPreview, PDFParseResponse, PDFImportRequest

class PDFParserService:
    def parse_pdf(self, pdf_bytes: bytes, request: PDFImportRequest) -> PDFParseResponse:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        full_text = ""
        for page in doc:
            full_text += page.get_text()
        
        total_pages = len(doc)
        doc.close()

        # 1. Split by question delimiter
        # We use finditer to keep the delimiter if needed, or just split
        # If we use re.split with capturing group, it includes the delimiter in the list
        parts = re.split(f"({request.question_delimiter})", full_text)
        
        # Re-assemble questions (delimiter + content)
        questions_raw = []
        if len(parts) > 1:
            # If the first part is empty (it usually is if it starts with delimiter)
            start_idx = 1 if not parts[0].strip() else 0
            for i in range(start_idx, len(parts), 2):
                if i + 1 < len(parts):
                    questions_raw.append(parts[i] + parts[i+1])
                else:
                    questions_raw.append(parts[i])
        else:
            questions_raw = [full_text]

        parsed_questions = []
        warnings = []

        option_prefixes = [p.strip() for p in request.option_prefixes.split(",")]
        # Create a regex for options e.g. ^(A|B|C|D)[.:)]
        prefixes_regex = "|".join(re.escape(p) for p in option_prefixes)
        opt_pattern = re.compile(rf"^\s*({prefixes_regex})[.:)]\s*(.*)$", re.MULTILINE)

        for raw in questions_raw:
            raw = raw.strip()
            if not raw:
                continue
            
            # Split lines
            lines = raw.split("\n")
            question_lines = []
            options = []
            solution_lines = []
            
            is_collecting_solution = False
            
            # Check for correct answer marker in the whole text if it's a "Đáp án: " style
            marker_answer = None
            if request.correct_answer_marker and "Đáp án" in request.correct_answer_marker:
                # Look for something like "Đáp án: 1A" or "Đáp án: A"
                match = re.search(rf"{re.escape(request.correct_answer_marker)}\s*([A-Z])", raw, re.IGNORECASE)
                if match:
                    marker_answer = match.group(1).upper()

            for line in lines:
                line_clean = line.strip()
                if not line_clean:
                    continue
                
                # Check for option
                opt_match = opt_pattern.match(line)
                if opt_match:
                    prefix = opt_match.group(1).upper()
                    text = opt_match.group(2).strip()
                    
                    is_correct = False
                    # Check if marker is in prefix or text (e.g. *A. or A. *text)
                    if request.correct_answer_marker and request.correct_answer_marker in line:
                        if "Đáp án" not in request.correct_answer_marker:
                            is_correct = True
                    
                    if marker_answer and prefix == marker_answer:
                        is_correct = True
                        
                    options.append({"id": prefix, "text": text, "is_correct": is_correct})
                    continue

                if "Giải thích" in line or "Solution" in line:
                    is_collecting_solution = True
                    continue
                
                if is_collecting_solution:
                    solution_lines.append(line)
                elif not options: # Still in question part
                    # Don't include the delimiter in the content if possible? 
                    # Usually the delimiter is "Câu 1:", we might want to keep it or strip it.
                    question_lines.append(line)

            content = "\n".join(question_lines).strip()
            solution = "\n".join(solution_lines).strip() or None
            
            if content:
                parsed_questions.append(ParsedQuestionPreview(
                    content=content,
                    options=options,
                    solution=solution
                ))
            
        return PDFParseResponse(
            questions=parsed_questions,
            total_pages=total_pages,
            warnings=warnings
        )
