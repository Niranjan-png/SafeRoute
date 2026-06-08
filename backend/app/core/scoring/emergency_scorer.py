"""Emergency Scorer"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from sqlalchemy import func as geo_func

class EmergencyScorer:
    def __init__(self, db: AsyncSession):
        self.db = db
        
    async def compute_score(self, segment_id: int, geom_wkt: str) -> float:
        return 50.0
