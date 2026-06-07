"""
Routing Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db
from app.schemas.route import RouteRequest, RouteOptionsResponse

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
async def explain_route(route_id: str):
    raise HTTPException(status_code=404, detail="Route not found")
