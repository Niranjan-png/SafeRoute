"""
CCTV density scorer — scores road segments based on nearby active CCTV cameras.

Scoring table (per PRD §5.2):
  0 cameras within 200m → 0 points
  1–5 cameras          → 10 points
  6–20 cameras         → 20 points
  20+ cameras          → 30 points

Max score: 30
"""

from sqlalchemy import func as geo_func
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.cctv_camera import CCTVCamera


class CCTVScorer:
    """Compute CCTV density score for a road segment."""

    RADIUS_M = 200  # Search radius in meters

    async def score(self, db: AsyncSession, segment_geom) -> float:
        """
        Count active CCTV cameras within 200m of the segment geometry
        and return a score from 0–30.
        """
        count = await db.scalar(
            select(func.count(CCTVCamera.camera_id))
            .where(
                geo_func.ST_DWithin(
                    geo_func.ST_Transform(CCTVCamera.geom, 32643),  # UTM zone 43N for Bengaluru
                    geo_func.ST_Transform(segment_geom, 32643),
                    self.RADIUS_M,
                )
            )
            .where(CCTVCamera.is_active.is_(True))
        )

        if count == 0:
            return 0.0
        elif count <= 5:
            return 10.0
        elif count <= 20:
            return 20.0
        else:
            return 30.0
