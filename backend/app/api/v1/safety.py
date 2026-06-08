"""
Safety Heatmap & Score Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
import json

from app.dependencies import get_db

router = APIRouter()


@router.get("/score/{segment_id}")
async def get_segment_score(segment_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        text("SELECT segment_id, safety_score, cctv_score, crowd_score, lighting_score, emergency_score, crime_penalty FROM road_segments WHERE segment_id = :sid"),
        {"sid": segment_id},
    )
    row = result.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Segment not found")
    return dict(row._mapping)


@router.get("/heatmap")
async def get_heatmap(
    min_lat: float,
    min_lng: float,
    max_lat: float,
    max_lng: float,
    db: AsyncSession = Depends(get_db),
):
    query = """
        SELECT jsonb_build_object(
            'type', 'FeatureCollection',
            'features', COALESCE(jsonb_agg(ST_AsGeoJSON(t.*)::json), '[]'::jsonb)
        )
        FROM (
            SELECT segment_id, safety_score, geom
            FROM road_segments
            WHERE ST_Intersects(geom, ST_MakeEnvelope(:min_lng, :min_lat, :max_lng, :max_lat, 4326))
        ) AS t;
    """
    result = await db.execute(
        text(query),
        {"min_lng": min_lng, "min_lat": min_lat, "max_lng": max_lng, "max_lat": max_lat},
    )
    row = result.scalar()
    if row is None:
        return {"type": "FeatureCollection", "features": []}
    return row if isinstance(row, dict) else json.loads(row)
