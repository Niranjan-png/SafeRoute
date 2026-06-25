import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from app.models.base import Base

async def create_tables():
    engine = create_async_engine('postgresql+asyncpg://saferoute:saferoute_dev@localhost:5432/saferoute', echo=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(create_tables())
