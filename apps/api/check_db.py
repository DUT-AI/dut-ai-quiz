import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from app.config import settings
from sqlalchemy import text

async def check():
    engine = create_async_engine(settings.database_url, future=True)
    async with engine.connect() as conn:
        res = await conn.execute(text("SELECT id, status, snapshot IS NULL as is_snap_null FROM game_sessions ORDER BY started_at DESC LIMIT 5"))
        for r in res:
            print(dict(r._mapping))

asyncio.run(check())
