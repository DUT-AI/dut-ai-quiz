import asyncio
from app.infrastructure.database import AsyncSessionLocal
from sqlalchemy import text

async def fix():
    async with AsyncSessionLocal() as session:
        await session.execute(text("UPDATE questions SET duplicate_status = 'NONE' WHERE duplicate_status = 'UNIQUE';"))
        await session.commit()
        print('Fixed duplicate_status in DB.')

asyncio.run(fix())
