import gzip
import io
import json
import tarfile
import zipfile
from dataclasses import replace
from uuid import uuid4

import py7zr
import pytest
from worker_evaluate_homework.application.use_cases import (
    EvaluateHomeworkSubmissionUseCase,
    RegisterHomeworkUseCase,
)
from worker_evaluate_homework.domain import (
    GradeResult,
    GradingCriterion,
    HomeworkGradingRecord,
    HomeworkRubric,
    InvalidArtifactError,
    SourceFile,
    SubmissionGradingRecord,
)
from worker_evaluate_homework.domain.fingerprints import (
    build_fingerprint,
    find_plagiarism,
)
from worker_evaluate_homework.infrastructure.archive_reader import (
    S3HomeworkArtifactReader,
)
from worker_evaluate_homework.infrastructure.gemini_grading_engine import (
    _analyze_sources,
)
from worker_evaluate_homework.presentation.arq_tasks import evaluate_homework_job


class RepositoryStub:
    def __init__(
        self,
        homework: HomeworkGradingRecord,
        submission: SubmissionGradingRecord | None = None,
    ) -> None:
        self.homework = homework
        self.submission = submission
        self.saved_result = None
        self.saved_plagiarism = None
        self.saved_fingerprints = []
        self.saved_error = None

    async def get_homework(self, homework_id):
        return self.homework if homework_id == self.homework.id else None

    async def set_homework_processing(self, homework_id):
        return None

    async def save_homework_rubric(self, homework_id, rubric):
        self.homework = replace(self.homework, grading_rubric=rubric)

    async def save_homework_error(self, homework_id, error):
        return None

    async def get_submission(self, submission_id):
        if self.submission and submission_id == self.submission.id:
            return self.submission
        return None

    async def set_submission_grading(self, submission_id):
        return None

    async def save_submission_result(
        self,
        submission_id,
        result,
        plagiarism,
        copied_user_id,
    ):
        self.saved_result = result
        self.saved_plagiarism = plagiarism

    async def save_submission_error(
        self,
        submission_id,
        error,
        *,
        final,
    ):
        self.saved_error = (submission_id, error, final)

    async def list_previous_fingerprints(
        self,
        homework_id,
        user_id,
        file_names,
    ):
        return []

    async def replace_fingerprints(self, submission, values):
        self.saved_fingerprints = values


class ArtifactReaderStub:
    async def read_homework_text(self, object_key):
        return "Write main.py"

    async def read_submission_sources(self, object_key):
        return [SourceFile(name="main.py", content="print('ok')")]


class GradingEngineStub:
    async def create_rubric(self, homework, attachment_text):
        return HomeworkRubric(
            topic="Python",
            required_files=["main.py"],
            requirements=["Print ok"],
            criteria=[
                GradingCriterion(
                    id="print_output",
                    criterion="Kết quả đầu ra",
                    description="In đúng giá trị mà đề bài yêu cầu.",
                    weight=7,
                ),
                GradingCriterion(
                    id="required_file",
                    criterion="Cấu trúc bài nộp",
                    description="Có đầy đủ file Python bắt buộc.",
                    weight=2,
                ),
                GradingCriterion(
                    id="code_quality",
                    criterion="Chất lượng mã nguồn",
                    description="Mã nguồn rõ ràng và dễ đọc.",
                    weight=1,
                ),
            ],
        )

    async def grade(self, rubric, sources):
        return GradeResult(
            is_pass=True,
            score=9.0,
            feedback="Good",
            score_details=[],
        )


class InvalidArtifactReaderStub(ArtifactReaderStub):
    async def read_submission_sources(self, object_key):
        raise InvalidArtifactError("Archive bị hỏng")


class InvalidEvaluationUseCaseStub:
    async def execute(self, submission_id, *, final_attempt):
        raise InvalidArtifactError("Bài nộp không hợp lệ")


@pytest.mark.asyncio
async def test_submission_is_graded_without_external_checker() -> None:
    homework_id = uuid4()
    submission_id = uuid4()
    repository = RepositoryStub(
        HomeworkGradingRecord(
            id=homework_id,
            title="Python",
            description="Write main.py",
            attachment_key=None,
            grading_rubric=None,
        ),
        SubmissionGradingRecord(
            id=submission_id,
            homework_id=homework_id,
            user_id=99,
            object_key="submission.zip",
            status="GRADING",
            score=None,
        ),
    )
    reader = ArtifactReaderStub()
    engine = GradingEngineStub()
    register = RegisterHomeworkUseCase(repository, reader, engine)
    evaluate = EvaluateHomeworkSubmissionUseCase(
        repository,
        reader,
        engine,
        register,
        0.8,
    )

    score = await evaluate.execute(submission_id, final_attempt=True)

    assert score == 9.0
    assert repository.saved_result.is_pass is True
    assert repository.homework.grading_rubric is not None
    assert repository.saved_fingerprints[0]["file_name"] == "main.py"


@pytest.mark.asyncio
async def test_invalid_archive_is_marked_as_final_failure() -> None:
    homework_id = uuid4()
    submission_id = uuid4()
    repository = RepositoryStub(
        HomeworkGradingRecord(
            id=homework_id,
            title="Python",
            description="Write main.py",
            attachment_key=None,
            grading_rubric=HomeworkRubric(topic="Python").model_dump(),
        ),
        SubmissionGradingRecord(
            id=submission_id,
            homework_id=homework_id,
            user_id=99,
            object_key="submission.rar",
            status="GRADING",
            score=None,
        ),
    )
    reader = InvalidArtifactReaderStub()
    engine = GradingEngineStub()
    register = RegisterHomeworkUseCase(repository, reader, engine)
    evaluate = EvaluateHomeworkSubmissionUseCase(
        repository,
        reader,
        engine,
        register,
        0.8,
    )

    with pytest.raises(InvalidArtifactError, match="Archive bị hỏng"):
        await evaluate.execute(submission_id, final_attempt=False)

    assert repository.saved_error == (
        submission_id,
        "Archive bị hỏng",
        True,
    )


@pytest.mark.asyncio
async def test_invalid_submission_marks_arq_job_as_failed() -> None:
    submission_id = uuid4()

    with pytest.raises(InvalidArtifactError, match="Bài nộp không hợp lệ"):
        await evaluate_homework_job(
            {
                "evaluate_use_case": InvalidEvaluationUseCaseStub(),
                "job_try": 1,
            },
            str(submission_id),
        )


def test_identical_python_sources_are_detected() -> None:
    current = build_fingerprint(
        SourceFile(name="main.py", content="def add(a, b): return a + b")
    )
    previous = [
        type(
            "Stored",
            (),
            {
                "user_id": 7,
                "file_name": "main.py",
                "fingerprints": frozenset(current["fingerprints"]),
            },
        )()
    ]

    _, score, user_id = find_plagiarism([current], previous)

    assert score == 1.0
    assert user_id == 7


def test_plagiarism_score_covers_the_whole_multifile_submission() -> None:
    copied = build_fingerprint(
        SourceFile(name="main.py", content="print('shared bootstrap')")
    )
    original = build_fingerprint(
        SourceFile(
            name="model.py",
            content=(
                "class Model:\n"
                "    def train(self, values):\n"
                "        return [value * 3 for value in values]\n"
            ),
        )
    )
    previous = [
        type(
            "Stored",
            (),
            {
                "user_id": 7,
                "file_name": "main.py",
                "fingerprints": frozenset(copied["fingerprints"]),
            },
        )()
    ]

    _, score, user_id = find_plagiarism([copied, original], previous)

    assert 0 < score < 0.8
    assert user_id == 7


def test_static_analysis_enforces_allowed_library_policy() -> None:
    result = _analyze_sources(
        HomeworkRubric(
            topic="ML",
            allowed_libraries=["pytorch"],
        ),
        [
            SourceFile(
                name="main.py",
                content="import os\nimport torch\nimport pandas\n",
            )
        ],
    )

    assert result["unauthorized_imports"] == ["pandas"]
    assert result["forbidden_imports"] == []


def test_static_analysis_maps_forbidden_library_names() -> None:
    result = _analyze_sources(
        HomeworkRubric(
            topic="ML",
            forbidden_libraries=["pytorch"],
        ),
        [SourceFile(name="main.py", content="import torchvision\n")],
    )

    assert result["forbidden_imports"] == ["torchvision"]


def test_static_analysis_allows_modules_from_the_submitted_project() -> None:
    result = _analyze_sources(
        HomeworkRubric(
            topic="Project",
            allowed_libraries=["requests"],
        ),
        [
            SourceFile(
                name="main.py",
                content="from project import helpers\nimport requests\n",
            ),
            SourceFile(
                name="project/helpers.py",
                content="def answer():\n    return 42\n",
            ),
        ],
    )

    assert result["unauthorized_imports"] == []
    assert result["local_modules"] == ["helpers", "main", "project"]


def test_zip_source_reader_extracts_python_only() -> None:
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as archive:
        archive.writestr("src/main.py", "print('ok')")
        archive.writestr("README.md", "ignored")

    sources = S3HomeworkArtifactReader._read_python_sources(
        buffer.getvalue(),
        "submission.zip",
    )

    assert sources == [SourceFile(name="src/main.py", content="print('ok')")]


def test_zip_source_reader_extracts_all_gradable_notebook_content() -> None:
    notebook = {
        "cells": [
            {
                "cell_type": "markdown",
                "source": ["## Câu trả lời lý thuyết\n", "Độ phức tạp là O(n)."],
            },
            {
                "cell_type": "code",
                "source": ["def answer():\n", "    return 42\n"],
            },
            {
                "cell_type": "code",
                "source": "print(answer())",
                "outputs": [
                    {"output_type": "stream", "name": "stdout", "text": "42\n"},
                    {
                        "output_type": "execute_result",
                        "data": {"text/plain": ["Result: 42"]},
                        "execution_count": 2,
                    },
                ],
            },
        ],
        "metadata": {},
        "nbformat": 4,
        "nbformat_minor": 5,
    }
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as archive:
        archive.writestr("submission.ipynb", json.dumps(notebook))

    sources = S3HomeworkArtifactReader._read_python_sources(
        buffer.getvalue(),
        "submission.zip",
    )

    assert sources == [
        SourceFile(
            name="submission.ipynb",
            content=(
                "# --- markdown cell 1 ---\n"
                "# ## Câu trả lời lý thuyết\n"
                "# Độ phức tạp là O(n).\n\n"
                "# --- code cell 2 ---\n"
                "def answer():\n"
                "    return 42\n\n"
                "# --- code cell 3 ---\n"
                "print(answer())\n\n"
                "# --- output 3.1 ---\n"
                "# 42\n\n"
                "# --- output 3.2 ---\n"
                "# Result: 42\n"
            ),
        )
    ]


def test_markdown_only_notebook_is_accepted_for_theory_answers() -> None:
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as archive:
        archive.writestr(
            "submission.ipynb",
            json.dumps(
                {
                    "cells": [{"cell_type": "markdown", "source": "# Empty"}],
                    "nbformat": 4,
                }
            ),
        )

    sources = S3HomeworkArtifactReader._read_python_sources(
        buffer.getvalue(),
        "submission.zip",
    )

    assert sources == [
        SourceFile(
            name="submission.ipynb",
            content="# --- markdown cell 1 ---\n# # Empty\n",
        )
    ]


def test_homework_zip_allows_any_files_and_collects_every_pdf() -> None:
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as archive:
        archive.writestr("README.md", "instructions")
        archive.writestr("assets/data.csv", "a,b")
        archive.writestr("part-2.pdf", b"second pdf")
        archive.writestr("part-1.PDF", b"first pdf")

    pdfs = S3HomeworkArtifactReader._read_pdfs_from_zip(buffer.getvalue())

    assert pdfs == [
        ("part-1.PDF", b"first pdf"),
        ("part-2.pdf", b"second pdf"),
    ]


def test_homework_zip_without_pdf_is_valid() -> None:
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as archive:
        archive.writestr("requirements.md", "Use Python")

    assert S3HomeworkArtifactReader._read_pdfs_from_zip(buffer.getvalue()) == []


def test_notebook_shell_escape_is_not_a_python_syntax_error() -> None:
    notebook = {
        "cells": [
            {
                "cell_type": "code",
                "source": [
                    "!pip install pandas\n",
                    "%matplotlib inline\n",
                    "import pandas as pd\n",
                    "values = pd.Series([1, 2, 3])\n",
                ],
            }
        ],
        "nbformat": 4,
    }
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as archive:
        archive.writestr("analysis.ipynb", json.dumps(notebook))

    sources = S3HomeworkArtifactReader._read_python_sources(
        buffer.getvalue(),
        "submission.zip",
    )
    analysis = _analyze_sources(HomeworkRubric(topic="Notebook"), sources)

    assert analysis["syntax_errors"] == []
    assert "Jupyter command ignored: !pip install pandas" in sources[0].content
    assert "Jupyter command ignored: %matplotlib inline" in sources[0].content


def test_shell_escape_in_python_file_remains_a_syntax_error() -> None:
    analysis = _analyze_sources(
        HomeworkRubric(topic="Python"),
        [SourceFile(name="main.py", content="!pip install pandas\nimport pandas")],
    )

    assert analysis["syntax_errors"]


def test_tar_gz_source_reader_extracts_python() -> None:
    buffer = io.BytesIO()
    content = b"def answer():\n    return 42\n"
    with tarfile.open(fileobj=buffer, mode="w:gz") as archive:
        info = tarfile.TarInfo("project/main.py")
        info.size = len(content)
        archive.addfile(info, io.BytesIO(content))

    sources = S3HomeworkArtifactReader._read_python_sources(
        buffer.getvalue(),
        "submission.tar.gz",
    )

    assert sources == [
        SourceFile(
            name="project/main.py",
            content="def answer():\n    return 42\n",
        )
    ]


def test_gzip_source_reader_extracts_single_python_file() -> None:
    sources = S3HomeworkArtifactReader._read_python_sources(
        gzip.compress(b"print('gzip')"),
        "main.py.gz",
    )

    assert sources == [SourceFile(name="main.py", content="print('gzip')")]


def test_7z_source_reader_extracts_python() -> None:
    buffer = io.BytesIO()
    with py7zr.SevenZipFile(buffer, mode="w") as archive:
        archive.writestr("print('7z')", "src/main.py")
        archive.writestr("ignored", "README.md")

    sources = S3HomeworkArtifactReader._read_python_sources(
        buffer.getvalue(),
        "submission.7z",
    )

    assert sources == [SourceFile(name="src/main.py", content="print('7z')")]


def test_archive_reader_rejects_unsafe_paths() -> None:
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as archive:
        archive.writestr("../main.py", "print('unsafe')")

    with pytest.raises(ValueError, match="không an toàn"):
        S3HomeworkArtifactReader._read_python_sources(
            buffer.getvalue(),
            "submission.zip",
        )


def test_rar_extension_is_dispatched(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    expected = [SourceFile(name="main.py", content="print('rar')")]
    monkeypatch.setattr(
        "worker_evaluate_homework.infrastructure.archive_reader._read_rar_sources",
        lambda content: expected,
    )

    sources = S3HomeworkArtifactReader._read_python_sources(
        b"rar",
        "submission.rar",
    )

    assert sources == expected


@pytest.mark.asyncio
async def test_openai_llm_client_and_grading_engine() -> None:
    from unittest.mock import AsyncMock, MagicMock
    from worker_evaluate_homework.infrastructure.llm_clients import (
        OpenAILLMClient,
        _extract_json,
    )
    from worker_evaluate_homework.infrastructure.gemini_grading_engine import (
        HomeworkGradingEngine,
    )

    # Test _extract_json helper
    assert _extract_json('```json\n{"status": true}\n```') == '{"status": true}'
    assert _extract_json('Result is: {"status": true} done') == '{"status": true}'

    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.raise_for_status = MagicMock()

    rubric_payload = {
        "title": "Bài 1: Linear Regression",
        "description": "Cài đặt thuật toán hồi quy",
        "required_files": ["main.py"],
        "allowed_libraries": [],
        "forbidden_libraries": [],
        "requirements": ["Viết hàm fit và predict"],
        "criteria": [
            {
                "id": "c1",
                "criterion": "Hàm fit",
                "description": "Huấn luyện mô hình",
                "weight": 5.0,
            },
            {
                "id": "c2",
                "criterion": "Hàm predict",
                "description": "Dự đoán",
                "weight": 5.0,
            },
        ],
    }

    mock_response.json.return_value = {
        "choices": [
            {
                "message": {
                    "content": f"```json\n{json.dumps(rubric_payload)}\n```"
                }
            }
        ]
    }
    mock_client.post = AsyncMock(return_value=mock_response)

    llm_client = OpenAILLMClient(
        api_url="https://llm2.dutai.site/v1",
        model="ggml-org/gemma-4-e4b-it-GGUF:Q4_0",
        http_client=mock_client,
    )
    engine = HomeworkGradingEngine(llm_client=llm_client)

    rubric = await engine.create_rubric(
        HomeworkGradingRecord(
            id=uuid4(),
            title="Linear Regression",
            description="Cài đặt hồi quy",
        ),
        "Đề bài chi tiết...",
    )

    assert rubric.title == "Bài 1: Linear Regression"
    assert len(rubric.criteria) == 2
    assert sum(c.weight for c in rubric.criteria) == 10.0

    # Test grading
    grade_payload = {
        "evaluations": [
            {
                "id": "c1",
                "status": True,
                "description": "Đã cài đặt hàm fit chính xác",
            },
            {
                "id": "c2",
                "status": True,
                "description": "Đã cài đặt hàm predict chính xác",
            },
        ]
    }
    mock_response.json.return_value = {
        "choices": [
            {
                "message": {
                    "content": json.dumps(grade_payload)
                }
            }
        ]
    }

    grade_result = await engine.grade(
        rubric,
        [SourceFile(name="main.py", content="def fit(): pass\ndef predict(): pass")],
    )

    assert grade_result.is_pass is True
    assert grade_result.score == 10.0
    assert len(grade_result.score_details) == 2
