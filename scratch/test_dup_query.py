import asyncio
from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.orm import aliased

from app.infrastructure.persistence.models.question import Question
from app.domain.entities.question import QuestionStatus

async def test():
    # Try connecting to localhost instead of the remote IP in case of port forwarding/SSH tunnel
    db_url = "postgresql+asyncpg://dutai_dev:dutai_dev@127.0.0.1:6070/quizdb_dev"
    print("Database URL:", db_url)
    engine = create_async_engine(db_url)
    async_session = async_sessionmaker(engine, expire_on_commit=False)
    
    async with async_session() as session:
        # Let's count draft and public questions
        r_draft = await session.execute(select(func.count(Question.id)).where(Question.status == QuestionStatus.DRAFT))
        draft_count = r_draft.scalar()
        print("Draft count:", draft_count)
        
        r_public = await session.execute(select(func.count(Question.id)).where(Question.status == QuestionStatus.PUBLIC))
        public_count = r_public.scalar()
        print("Public count:", public_count)

        # Let's check some draft questions and duplicate risk query
        PublicQuestion = aliased(Question)
        distance = Question.embedding.cosine_distance(PublicQuestion.embedding)
        has_dup_exists = select(1).where(
            PublicQuestion.status == QuestionStatus.PUBLIC,
            PublicQuestion.id != Question.id,
            PublicQuestion.embedding.is_not(None),
            PublicQuestion.embedding_model == Question.embedding_model,
            (1 - distance) >= 0.85
        ).exists()

        stmt = select(Question, has_dup_exists.label("has_duplicate")).where(Question.status == QuestionStatus.DRAFT).limit(10)
        r = await session.execute(stmt)
        rows = r.all()
        print(f"Sample Draft questions:")
        for q, has_dup in rows:
            print(f"- ID: {q.id}, Content: {q.content[:40]}, Has embedding: {q.embedding is not None}, Embedding Model: {q.embedding_model}, Has dup flag: {has_dup}")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(test())
