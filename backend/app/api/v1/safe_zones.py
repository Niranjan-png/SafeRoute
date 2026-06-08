"""
Safe Zones Endpoints
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.dependencies import get_db

router = APIRouter()


@router.get("/nearby")
async def get_safe_zones(
    lat: float,
    lng: float,
    radius: int = 2000,
    types: str = None,
    db: AsyncSession = Depends(get_db),
):
    query = """
        SELECT facility_id, facility_type, name, phone, is_24hr,
               ST_Y(geom) as lat, ST_X(geom) as lng
        FROM emergency_facilities
        WHERE ST_DWithin(
            geom::geography,
            ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
            :radius
        )
    """
    params = {"lng": lng, "lat": lat, "radius": radius}

    if types:
        type_list = [t.strip() for t in types.split(",")]
        # Use ANY for filtering
        query += " AND facility_type = ANY(:types)"
        params["types"] = type_list

    result = await db.execute(text(query), params)
    rows = result.fetchall()

    facilities = [
        {
            "facility_id": r.facility_id,
            "facility_type": r.facility_type,
            "name": r.name,
            "phone": r.phone,
            "is_24hr": r.is_24hr,
            "lat": r.lat,
            "lng": r.lng,
        }
        for r in rows
    ]
    return {"facilities": facilities, "total": len(facilities)}
