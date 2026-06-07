"""
Lighting scorer — scores road segments based on nearby streetlight density.

Scoring (0–15):
  Dense lighting (>5 lights per 100m of road):    15
  Medium lighting (2–5 lights per 100m):          10
  Sparse lighting (1 light per 100m):              5
  No lighting:                                     0

Max score: 15
"""

from sqlalchemy import func as geo_func
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.streetlight import Streetlight


class LightingScorer:
    """Compute lighting score for a road segment."""

    RADIUS_M = 50  # Search radius around the segment centerline

    async def score(self, db: AsyncSession, segment_geom, segment_length_m: float) -> float:
        """
        Count active streetlights near the segment and compute a
        density-based score (0–15).
        """
        # Count streetlights within 50m of the segment
        count = await db.scalar(
            select(func.count(Streetlight.light_id))
            .where(
                geo_func.ST_DWithin(
                    geo_func.ST_Transform(Streetlight.geom, 32643),
                    geo_func.ST_Transform(segment_geom, 32643),
                    self.RADIUS_M,
                )
            )
            .where(Streetlight.is_active.is_(True))
        )

        if count == 0 or segment_length_m == 0:
            return 0.0

        # Density: lights per 100m of road
        density = (count / segment_length_m) * 100

        if density >= 5:
            return 15.0
        elif density >= 2:
            return 10.0
        elif density >= 1:
            return 5.0
        else:
            # Partial score for sparse lighting
            return max(1.0, density * 5.0)
