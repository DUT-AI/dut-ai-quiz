from datetime import datetime
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from app.application.use_cases.questions.question_use_case import ListQuestionsUseCase
from app.domain.entities.question import QuestionEntity, QuestionOptionEntity
from app.domain.value_objects import Difficulty, PoolType
from app.presentation.schemas.questions import QuestionListQuery, QuestionOptionOut, QuestionOut


@pytest.mark.asyncio
async def test_list_practice_questions_use_case():
    """Test that ListQuestionsUseCase queries repository with PoolType.PRACTICE correctly."""
    question_repo = AsyncMock()

    lesson_id = uuid4()
    option_1 = QuestionOptionEntity(id="opt-1", text="Option A", is_correct=True)
    option_2 = QuestionOptionEntity(id="opt-2", text="Option B", is_correct=False)

    question = QuestionEntity(
        id=uuid4(),
        pool_type=PoolType.PRACTICE,
        difficulty=Difficulty.EASY,
        content="What is Backprop?",
        options=[option_1, option_2],
        solution="Detailed backprop explanation.",
        lesson_id=lesson_id,
        tags=["ML", "DeepLearning"],
        created_by=1,
        created_at=datetime.utcnow(),
    )

    question_repo.list_all.return_value = [question]

    use_case = ListQuestionsUseCase(question_repo)
    query = QuestionListQuery(pool_type=PoolType.PRACTICE, lesson_id=lesson_id, offset=0, limit=50)

    result = await use_case.execute(query)

    # Assert repository was called with correct parameters
    question_repo.list_all.assert_called_once_with(
        pool_type=PoolType.PRACTICE,
        difficulty=None,
        lesson_id=lesson_id,
        tag=None,
        import_session_id=None,
        status=None,
        related_questions=None,
        offset=0,
        limit=50,
    )

    # Assert result content
    assert len(result) == 1
    assert result[0].content == "What is Backprop?"
    assert result[0].pool_type == PoolType.PRACTICE
    assert len(result[0].options) == 2
    assert result[0].options[0].is_correct is True
    assert result[0].solution == "Detailed backprop explanation."


def test_question_output_schema_serialization():
    """Test that the QuestionOut schema exposes options' correctness and the solution."""
    lesson_id = uuid4()
    question_id = uuid4()

    opt_out_1 = QuestionOptionOut(id="opt-1", text="Correct Choice", is_correct=True, fixed=False)
    opt_out_2 = QuestionOptionOut(
        id="opt-2", text="Incorrect Choice", is_correct=False, fixed=False
    )

    question_out = QuestionOut(
        id=question_id,
        pool_type=PoolType.PRACTICE,
        difficulty=Difficulty.MEDIUM,
        content="Explain overfitting.",
        options=[opt_out_1, opt_out_2],
        solution="Overfitting happens when a model learns noise.",
        lesson_id=lesson_id,
        tags=["Generalization"],
        created_by=1,
        created_at=datetime.utcnow(),
    )

    data = question_out.model_dump()

    assert data["id"] == question_id
    assert data["pool_type"] == "PRACTICE"
    assert data["solution"] == "Overfitting happens when a model learns noise."
    assert len(data["options"]) == 2
    assert data["options"][0]["id"] == "opt-1"
    assert data["options"][0]["is_correct"] is True
    assert data["options"][1]["id"] == "opt-2"
    assert data["options"][1]["is_correct"] is False


@pytest.mark.asyncio
async def test_answer_question_use_case():
    """Test that AnswerQuestionUseCase correctly validates user's answer option."""
    question_repo = AsyncMock()

    lesson_id = uuid4()
    option_1 = QuestionOptionEntity(id="opt-1", text="Option A", is_correct=True)
    option_2 = QuestionOptionEntity(id="opt-2", text="Option B", is_correct=False)

    question = QuestionEntity(
        id=uuid4(),
        pool_type=PoolType.PRACTICE,
        difficulty=Difficulty.EASY,
        content="What is Backprop?",
        options=[option_1, option_2],
        solution="Detailed backprop explanation.",
        lesson_id=lesson_id,
        tags=["ML"],
        created_by=1,
        created_at=datetime.utcnow(),
    )

    question_repo.get.return_value = question

    from app.application.use_cases.questions.answer_question_uc import AnswerQuestionUseCase

    use_case = AnswerQuestionUseCase(question_repo)

    # Test correct option selection
    res_correct = await use_case.execute(question.id, "opt-1")
    assert res_correct["is_correct"] is True
    assert res_correct["correct_option_id"] == "opt-1"
    assert res_correct["solution"] == "Detailed backprop explanation."

    # Test incorrect option selection
    res_incorrect = await use_case.execute(question.id, "opt-2")
    assert res_incorrect["is_correct"] is False
    assert res_incorrect["correct_option_id"] == "opt-1"

    # Test non-existent question
    question_repo.get.return_value = None
    res_none = await use_case.execute(uuid4(), "opt-1")
    assert res_none is None


def test_sanitize_questions_for_student():
    """Test that sanitize_questions_for_student strips solutions and options' correctness."""
    from app.presentation.api.routers.questions import sanitize_questions_for_student

    option_1 = QuestionOptionEntity(id="opt-1", text="Option A", is_correct=True)
    option_2 = QuestionOptionEntity(id="opt-2", text="Option B", is_correct=False)

    question = QuestionEntity(
        id=uuid4(),
        pool_type=PoolType.PRACTICE,
        difficulty=Difficulty.EASY,
        content="What is Backprop?",
        options=[option_1, option_2],
        solution="Detailed backprop explanation.",
        lesson_id=uuid4(),
        tags=["ML"],
        created_by=1,
        created_at=datetime.utcnow(),
    )

    sanitized = sanitize_questions_for_student([question])
    assert len(sanitized) == 1
    assert sanitized[0].solution is None
    assert sanitized[0].options[0].is_correct is None
    assert sanitized[0].options[1].is_correct is None


def test_question_to_student_schema_directly():
    """Test that QuestionToStudent automatically strips solution and is_correct via Pydantic model_validate."""
    from app.presentation.schemas.questions import QuestionToStudent

    option_1 = QuestionOptionEntity(id="opt-1", text="Option A", is_correct=True)
    option_2 = QuestionOptionEntity(id="opt-2", text="Option B", is_correct=False)

    question = QuestionEntity(
        id=uuid4(),
        pool_type=PoolType.PRACTICE,
        difficulty=Difficulty.EASY,
        content="What is Backprop?",
        options=[option_1, option_2],
        solution="Detailed backprop explanation.",
        lesson_id=uuid4(),
        tags=["ML", "AI"],
        created_by=1,
        created_at=datetime.utcnow(),
    )

    student_q = QuestionToStudent.model_validate(question)
    assert student_q.solution is None
    assert student_q.options[0].is_correct is None
    assert student_q.options[1].is_correct is None
    assert student_q.tags == ["ML", "AI"]
