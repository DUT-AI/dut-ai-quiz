import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from app.config import settings
from sqlalchemy import text

from app.infrastructure.repositories.game_sessions import GameSessionRepository
from app.infrastructure.persistence.models.game import GameSession
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker

async def check():
    engine = create_async_engine(settings.database_url, future=True)
    async with engine.connect() as conn:
        res = await conn.execute(text("SELECT id, status, user_id, tags_filter, started_at, completed_at FROM game_sessions WHERE 'cnn-co-ban' = ANY(tags_filter) ORDER BY started_at DESC LIMIT 5"))
        print("ALL SESSIONS FOR cnn-co-ban:")
        for r in res:
            print(dict(r._mapping))

asyncio.run(check())
