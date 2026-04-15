import random
import secrets

from sqlalchemy import select

from app.application.services.shuffle import build_shuffled_exam_payload
from app.infrastructure.persistence.models import PoolType, PracticeSession, PracticeSessionStatus, Question
from app.infrastructure.repositories.practice_sessions import PracticeSessionRepository


async def execute(session, user_id: int, tags: list[str], difficulty, limit: int):
    stmt = select(Question).where(Question.pool_type == PoolType.PRACTICE)
    if difficulty is not None:
        stmt = stmt.where(Question.difficulty == difficulty)
    r = await session.execute(stmt)
    pool = list(r.scalars().all())
    if tags:
        pool = [q for q in pool if set(tags) & set(q.tags)]
    if not pool:
        return None, "empty"
    k = min(limit, len(pool))
    seed = secrets.randbelow(2**31)
    rng = random.Random(seed)
    picked = rng.sample(pool, k=k)
    presentation, snapshot = build_shuffled_exam_payload(picked, seed)
    snap = {"shuffle": snapshot, "presentation": presentation, "answers": {}}
    row = PracticeSession(
        user_id=user_id,
        status=PracticeSessionStatus.IN_PROGRESS,
        snapshot=snap,
        tags_filter=tags,
        difficulty_filter=difficulty,
        question_limit=k,
    )
    repo = PracticeSessionRepository(session)
    row = await repo.add(row)
    return row, "ok"
