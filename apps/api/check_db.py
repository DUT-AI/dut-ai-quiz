import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from app.config import settings
from sqlalchemy import text

async def check():
    engine = create_async_engine(settings.database_url, future=True)
    async with engine.connect() as conn:
        res = await conn.execute(text("SELECT id, status, tags_filter, snapshot->'gamification'->>'final_score' as final_score FROM practice_sessions"))
        for r in res:
            print(dict(r._mapping))

asyncio.run(check())
