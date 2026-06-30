import asyncio
import os
import sys
from uuid import uuid4, UUID

# Add current directory to path
sys.path.append(os.getcwd())

from app.infrastructure.database import AsyncSessionLocal
from app.infrastructure.repositories.attempts import AttemptRepository
from app.infrastructure.persistence.models import Attempt
from app.domain.value_objects import AttemptStatus
from app.core.datetime_utils import now_ict

async def test_patch():
    async with AsyncSessionLocal() as s:
        # 1. Create a dummy attempt
        att_id = uuid4()
        att = Attempt(
            id=att_id,
            exam_id=uuid4(),
            user_id=999,
            started_at=now_ict(),
            expires_at=now_ict(),
            status=AttemptStatus.IN_PROGRESS
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
