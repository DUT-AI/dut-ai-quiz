import asyncio
import os
import sys
from uuid import uuid4

# Add current directory to path
sys.path.append(os.getcwd())

import pytest
from app.core.datetime_utils import now_ict
from app.domain.value_objects import AttemptStatus
from app.infrastructure.database import AsyncSessionLocal
from app.infrastructure.persistence.models import Attempt
from app.infrastructure.repositories.attempts import AttemptRepository


@pytest.mark.asyncio
async def test_patch():
    async with AsyncSessionLocal() as s:
        # 1. Create a dummy exam to satisfy foreign key constraint
        from app.infrastructure.persistence.models.exam import Exam

        exam_id = uuid4()
        dummy_exam = Exam(
            id=exam_id,
            title="Dummy Exam",
            description="Dummy Description",
            created_by=999,
            participant_ids=[999],
        )
        s.add(dummy_exam)
        await s.flush()

        att_id = uuid4()
        att = Attempt(
            id=att_id,
            exam_id=exam_id,
            user_id=999,
            started_at=now_ict(),
            expires_at=now_ict(),
            status=AttemptStatus.IN_PROGRESS,
        )
        s.add(att)
        await s.flush()
        print(f"Created attempt {att_id}")

        # 2. Patch an answer
        repo = AttemptRepository(s)
        q_id = uuid4()
        ans = await repo.upsert_answer(att_id, q_id, "option_a")
        print(f"Upserted answer: {ans}")

        await s.commit()
        print("Committed transaction")

    # 3. Verify in a new session
    async with AsyncSessionLocal() as s:
        repo = AttemptRepository(s)
        answers = await repo.list_answers(att_id)
        print(f"Found {len(answers)} answers for attempt {att_id}")
        if answers:
            print(f"  First answer: {answers[0]}")


if __name__ == "__main__":
    asyncio.run(test_patch())
