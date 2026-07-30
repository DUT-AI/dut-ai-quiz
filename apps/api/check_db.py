import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.config import settings
async def check_cols():
    engine = create_async_engine(settings.database_url)
    async with engine.begin() as conn:
        res = await conn.execute(text("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name='import_sessions'"))
        for r in res:
            print(r)
asyncio.run(check_cols())
