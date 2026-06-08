"""Crime Scorer"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from sqlalchemy import func as geo_func

class CrimeScorer:
    def __init__(self, db: AsyncSession):
        self.db = db
        
    async def compute_penalty(self, segment_id: int, geom_wkt: str) -> float:
        # Crime penalty based on incidents near segment
        return 0.0
