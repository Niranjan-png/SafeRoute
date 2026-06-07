"""API v1 router — aggregates all endpoint routers."""

from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.report import router as report_router
from app.api.v1.route import router as route_router
from app.api.v1.safe_zones import router as safe_zones_router
from app.api.v1.safety import router as safety_router
from app.api.v1.sos import router as sos_router
from app.api.v1.websocket_route import router as ws_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["Auth"])
api_router.include_router(route_router, prefix="/route", tags=["Routing"])
api_router.include_router(safety_router, prefix="/safety", tags=["Safety"])
api_router.include_router(sos_router, tags=["SOS"])
api_router.include_router(report_router, prefix="/report", tags=["Reports"])
api_router.include_router(safe_zones_router, prefix="/safe-zones", tags=["Safe Zones"])
api_router.include_router(ws_router, prefix="/ws", tags=["WebSocket"])
