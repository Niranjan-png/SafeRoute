"""
Routing Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from app.dependencies import get_db
from app.schemas.route import RouteRequest, RouteOptionsResponse
from app.models.route_result import RouteResult

router = APIRouter()


@router.post("/options", response_model=RouteOptionsResponse)
async def get_routes(request: RouteRequest, db: AsyncSession = Depends(get_db)):
    from app.main import graph_builder
    if not graph_builder.G or len(graph_builder.G) == 0:
        raise HTTPException(status_code=503, detail="Routing graph not yet initialized")

    from app.core.routing.route_service import RouteService
    route_service = RouteService(graph_builder)
    routes = await route_service.compute_routes(db, request.source, request.destination)
    if not routes:
        raise HTTPException(status_code=404, detail="No route found between coordinates")

    return routes


@router.get("/explain/{route_id}")
async def explain_route(route_id: str, db: AsyncSession = Depends(get_db)):
    try:
        route_uuid = uuid.UUID(route_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid route_id format")
    result = await db.execute(select(RouteResult).where(RouteResult.route_id == route_uuid))
    route_result = result.scalar_one_or_none()
    if not route_result:
        raise HTTPException(status_code=404, detail="Route not found")
    segment_scores = route_result.segment_scores or {}
    segments = []
    for seg in segment_scores.get("segments", segment_scores):
        segments.append({
            "segment_id": seg.get("segment_id"),
            "road_name": seg.get("road_name"),
            "length_m": seg.get("length_m"),
            "safety_score": seg.get("safety_score"),
            "is_unsafe": seg.get("safety_score", 50) < 50,
        })
    unsafe_count = sum(1 for s in segments if s["is_unsafe"])
    safest = max(segments, key=lambda s: s["safety_score"]) if segments else {}
    most_dangerous = min(segments, key=lambda s: s["safety_score"]) if segments else {}
    summary = (
        f"This route covers {route_result.distance_m:.0f}m with an estimated "
        f"travel time of {route_result.eta_seconds // 60} minutes. "
        f"Overall safety score: {route_result.safety_score}/100. "
        f"{sum(1 for s in segments if not s['is_unsafe'])}% of segments rated safe. "
        f"⚠️ {unsafe_count} segment(s) have safety scores below 50."
    )
    return {
        "route_id": str(route_result.route_id),
        "safety_score": route_result.safety_score,
        "distance_m": route_result.distance_m,
        "eta_seconds": route_result.eta_seconds,
        "segments": segments,
        "summary": summary,
        "safest_segment": safest,
        "most_dangerous_segment": most_dangerous,
        "computed_at": route_result.computed_at,
        "expires_at": route_result.expires_at,
    }
