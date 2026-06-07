"""
Safety Score Engine
"""
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession


class SafetyScoreEngine:
    def __init__(self, db: AsyncSession):
        self.db = db

    @staticmethod
    def time_multiplier(timestamp: datetime) -> float:
        """
        Time-of-day safety multiplier.

        Bands:
          08:00–20:00  → 1.00 (daytime, safest)
          20:00–22:00  → 0.85 (early evening)
          05:00–08:00  → 0.80 (early morning)
          22:00–00:00  → 0.70 (late evening)
          00:00–05:00  → 0.65 (deep night, least safe)
        """
        hour = timestamp.hour
        if 8 <= hour < 20:
            return 1.0
        elif 20 <= hour < 22:
            return 0.85
        elif 5 <= hour < 8:
            return 0.80
        elif 22 <= hour <= 23:
            return 0.70
        else:  # 0–4 AM
            return 0.65

    async def recompute_all(self):
        pass
