import os

files = {}

files['d:/SafeRoute/backend/app/config.py'] = '''"""
SafeRoute Bengaluru — Application Configuration
Loads all settings from environment variables using Pydantic Settings.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """Application settings loaded from .env file or environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # --- Application ---
    app_name: str = "SafeRoute Bengaluru"
    app_version: str = "0.1.0"
    debug: bool = False

    # --- Database ---
    database_url: str = "postgresql+asyncpg://saferoute:saferoute_dev@localhost:5432/saferoute"
    database_url_sync: str = "postgresql://saferoute:saferoute_dev@localhost:5432/saferoute"

    # --- Redis ---
    redis_url: str = "redis://localhost:6379/0"

    # --- Celery ---
    celery_broker_url: str = "redis://localhost:6379/1"
    celery_result_backend: str = "redis://localhost:6379/2"

    # --- JWT Auth ---
    jwt_secret_key: str = "CHANGE_ME_TO_A_RANDOM_SECRET_STRING"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 1440  # 24 hours

    # --- SMS / Twilio ---
    sms_backend: str = "mock"  # "mock" or "twilio"
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_verify_service_sid: str = ""
    twilio_phone_number: str = ""

    # --- CORS ---
    cors_allowed_origins: str = "http://localhost:3000,http://localhost:5173"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_allowed_origins.split(",")]

    # --- Graph ---
    graph_rebuild_on_startup: bool = True

    # --- Safety Score Weights ---
    weight_cctv: float = 0.30
    weight_crowd: float = 0.25
    weight_emergency: float = 0.20
    weight_lighting: float = 0.15
    weight_crime: float = 0.10

    # --- Routing ---
    routing_alpha: float = 0.8
    routing_beta: float = 0.1
    routing_gamma: float = 0.1

settings = Settings()
'''

files['d:/SafeRoute/backend/app/dependencies.py'] = '''"""
FastAPI Dependencies for SafeRoute Bengaluru.
"""

from typing import AsyncGenerator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import settings
from app.models.base import async_session_factory
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/verify-otp")

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        yield session

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
        
    result = await db.execute(select(User).where(User.user_id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception
    return user
'''

files['d:/SafeRoute/backend/app/main.py'] = '''"""
SafeRoute Bengaluru — FastAPI Main Application.
"""

from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.config import settings
from app.core.routing.graph_builder import GraphBuilder

logger = logging.getLogger(__name__)

# Global instances
graph_builder = GraphBuilder()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting SafeRoute Bengaluru Backend...")
    if settings.graph_rebuild_on_startup:
        logger.info("Building in-memory graph from PostGIS...")
        await graph_builder.build_graph()
    yield
    # Shutdown
    logger.info("Shutting down SafeRoute Bengaluru Backend...")

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "version": settings.app_version}
'''

files['d:/SafeRoute/backend/app/schemas/route.py'] = '''"""Pydantic schemas for routing endpoints."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class Coordinates(BaseModel):
    """Latitude/longitude pair."""
    lat: float = Field(..., ge=-90, le=90, description="Latitude")
    lng: float = Field(..., ge=-180, le=180, description="Longitude")


class RouteRequest(BaseModel):
    """Request body for route computation."""
    source: Coordinates
    destination: Coordinates


class SegmentDetail(BaseModel):
    """Safety breakdown for a single road segment."""
    segment_id: int
    road_name: str | None = None
    length_m: float
    safety_score: float
    cctv_score: float
    crowd_score: float
    lighting_score: float
    emergency_score: float
    crime_penalty: float
    is_unsafe: bool = Field(default=False, description="True if safety_score < 50")


class RouteResponse(BaseModel):
    """A single computed route with its metadata."""
    route_id: uuid.UUID
    geojson: dict = Field(..., description="GeoJSON FeatureCollection of route segments")
    safety_score: float = Field(..., ge=0, le=100, description="Aggregate safety score (0-100)")
    distance_m: float = Field(..., description="Total distance in meters")
    eta_seconds: int = Field(..., description="Estimated travel time in seconds")
    segment_count: int
    unsafe_segment_count: int = Field(default=0, description="Number of segments with safety < 50")
    safety_label: str = Field(default="", description="Green (>75), Amber (50-75), Red (<50)")

    @staticmethod
    def compute_safety_label(score: float) -> str:
        if score > 75:
            return "green"
        elif score >= 50:
            return "amber"
        else:
            return "red"


class RouteOptionsResponse(BaseModel):
    """Response with top K route options."""
    routes: list[RouteResponse]
    computed_at: datetime
'''

files['d:/SafeRoute/backend/app/api/v1/auth.py'] = '''"""
Authentication Endpoints
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth.auth_service import AuthService
from app.core.auth.sms_client import SMSClient
from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.auth import SendOTPRequest, SendOTPResponse, VerifyOTPRequest, VerifyOTPResponse

router = APIRouter()
sms_client = SMSClient()
auth_service = AuthService(sms_client=sms_client)

@router.post("/send-otp", response_model=SendOTPResponse)
async def send_otp(request: SendOTPRequest, db: AsyncSession = Depends(get_db)):
    return await auth_service.send_otp(db, request.phone)

@router.post("/verify-otp", response_model=VerifyOTPResponse)
async def verify_otp(request: VerifyOTPRequest, db: AsyncSession = Depends(get_db)):
    return await auth_service.verify_otp(db, request.phone, request.otp)

@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {"user_id": str(current_user.user_id), "phone": current_user.phone, "name": current_user.name}
'''

files['d:/SafeRoute/backend/app/api/v1/report.py'] = '''"""
Community Safety Reporting Endpoints
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.report import CreateReportRequest, ReportResponse
from app.models.safety_report import SafetyReport

router = APIRouter()

@router.post("", response_model=ReportResponse)
async def create_report(
    request: CreateReportRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    report = SafetyReport(
        user_id=current_user.user_id,
        report_type=request.report_type,
        description=request.description
    )
    db.add(report)
    await db.flush()
    # Update geom
    await db.execute(text(
        "UPDATE safety_reports SET geom = ST_SetSRID(ST_MakePoint(:lng, :lat), 4326) WHERE report_id = :id"
    ), {"lng": request.location.lng, "lat": request.location.lat, "id": report.report_id})
    await db.commit()
    
    return ReportResponse(
        report_id=report.report_id,
        report_type=report.report_type,
        description=report.description,
        created_at=report.created_at,
        verified_count=0
    )
'''

files['d:/SafeRoute/backend/app/api/v1/route.py'] = '''"""
Routing Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db
from app.schemas.route import RouteRequest, RouteOptionsResponse
from app.core.routing.route_service import RouteService

router = APIRouter()

@router.post("", response_model=RouteOptionsResponse)
async def get_routes(request: RouteRequest, db: AsyncSession = Depends(get_db)):
    from app.main import graph_builder
    if not graph_builder.G or len(graph_builder.G) == 0:
        raise HTTPException(status_code=503, detail="Routing graph not yet initialized")
        
    route_service = RouteService(graph_builder)
    routes = await route_service.compute_routes(db, request.source, request.destination)
    if not routes:
        raise HTTPException(status_code=404, detail="No route found between coordinates")
        
    return routes
'''

files['d:/SafeRoute/backend/app/api/v1/safety.py'] = '''"""
Safety Heatmap Endpoints
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
import json

from app.dependencies import get_db

router = APIRouter()

@router.get("/heatmap")
async def get_heatmap(min_lat: float, min_lng: float, max_lat: float, max_lng: float, db: AsyncSession = Depends(get_db)):
    query = """
        SELECT jsonb_build_object(
            'type', 'FeatureCollection',
            'features', jsonb_agg(ST_AsGeoJSON(t.*)::json)
        )
        FROM (
            SELECT segment_id, safety_score, geom
            FROM road_segments
            WHERE ST_Intersects(geom, ST_MakeEnvelope(:min_lng, :min_lat, :max_lng, :max_lat, 4326))
        ) AS t;
    """
    result = await db.execute(text(query), {
        "min_lng": min_lng, "min_lat": min_lat, "max_lng": max_lng, "max_lat": max_lat
    })
    row = result.scalar()
    if row is None:
        return {"type": "FeatureCollection", "features": []}
    return row if isinstance(row, dict) else json.loads(row)
'''

files['d:/SafeRoute/backend/app/api/v1/safe_zones.py'] = '''"""
Safe Zones Endpoints
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
import json

from app.dependencies import get_db

router = APIRouter()

@router.get("")
async def get_safe_zones(lat: float, lng: float, radius: int = 2000, db: AsyncSession = Depends(get_db)):
    query = """
        SELECT jsonb_build_object(
            'type', 'FeatureCollection',
            'features', COALESCE(jsonb_agg(ST_AsGeoJSON(t.*)::json), '[]'::jsonb)
        )
        FROM (
            SELECT facility_id as id, facility_type as type, name, phone, is_24hr, geom
            FROM emergency_facilities
            WHERE ST_DWithin(geom::geography, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radius)
        ) AS t;
    """
    result = await db.execute(text(query), {"lng": lng, "lat": lat, "radius": radius})
    row = result.scalar()
    return row if isinstance(row, dict) else json.loads(row)
'''

files['d:/SafeRoute/backend/app/api/v1/websocket_route.py'] = '''"""
WebSocket Endpoints
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core.realtime.ws_manager import ws_manager

router = APIRouter()

@router.websocket("/{route_id}")
async def websocket_route_endpoint(websocket: WebSocket, route_id: str):
    await ws_manager.connect(websocket, route_id)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, route_id)
'''

files['d:/SafeRoute/backend/app/core/auth/auth_service.py'] = '''"""
Authentication Service
"""

import uuid
from datetime import datetime, timedelta
import jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import settings
from app.models.user import User
from app.core.auth.sms_client import SMSClient
from app.schemas.auth import SendOTPResponse, VerifyOTPResponse

class AuthService:
    def __init__(self, sms_client: SMSClient):
        self.sms_client = sms_client

    async def send_otp(self, db: AsyncSession, phone: str) -> SendOTPResponse:
        # Mock OTP generation for MVP
        otp = "123456"
        
        result = await db.execute(select(User).where(User.phone == phone))
        user = result.scalar_one_or_none()
        
        if not user:
            user = User(phone=phone)
            db.add(user)
        
        user.hashed_otp = otp  # In real app, hash it
        user.otp_expires_at = datetime.utcnow() + timedelta(minutes=5)
        await db.commit()
        
        await self.sms_client.send_message(phone, f"Your SafeRoute OTP is {otp}")
        return SendOTPResponse(message="OTP sent successfully")

    async def verify_otp(self, db: AsyncSession, phone: str, otp: str) -> VerifyOTPResponse:
        result = await db.execute(select(User).where(User.phone == phone))
        user = result.scalar_one_or_none()
        
        if not user or user.hashed_otp != otp or user.otp_expires_at < datetime.utcnow():
            raise Exception("Invalid or expired OTP")
            
        user.hashed_otp = None
        user.otp_expires_at = None
        await db.commit()
        
        access_token = self.create_access_token(data={"sub": str(user.user_id)})
        return VerifyOTPResponse(access_token=access_token, token_type="bearer")

    def create_access_token(self, data: dict) -> str:
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(minutes=settings.jwt_access_token_expire_minutes)
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
'''

files['d:/SafeRoute/backend/app/core/auth/sms_client.py'] = '''"""
SMS Client
"""
import logging
logger = logging.getLogger(__name__)

class SMSClient:
    async def send_message(self, phone: str, message: str) -> bool:
        logger.info(f"MOCK SMS to {phone}: {message}")
        return True
'''

files['d:/SafeRoute/backend/app/core/realtime/ws_manager.py'] = '''"""
WebSocket Manager
"""
from fastapi import WebSocket
from typing import Dict, List

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, route_id: str):
        await websocket.accept()
        if route_id not in self.active_connections:
            self.active_connections[route_id] = []
        self.active_connections[route_id].append(websocket)

    def disconnect(self, websocket: WebSocket, route_id: str):
        if route_id in self.active_connections:
            self.active_connections[route_id].remove(websocket)

    async def broadcast_update(self, route_id: str, message: dict):
        if route_id in self.active_connections:
            for connection in self.active_connections[route_id]:
                await connection.send_json(message)

ws_manager = ConnectionManager()
'''

files['d:/SafeRoute/backend/app/core/routing/dijkstra.py'] = '''"""
Dijkstra's Algorithm
"""
import networkx as nx
from typing import List, Tuple, Optional
from datetime import datetime
from app.core.routing.cost_function import edge_cost

def dijkstra_safest_route(
    G: nx.DiGraph,
    source: int,
    target: int,
    timestamp: datetime,
    alpha: float = 0.8,
    beta: float = 0.1,
    gamma: float = 0.1
) -> Optional[Tuple[List[int], float]]:
    
    def weight_func(u, v, data):
        return edge_cost(data, timestamp, alpha, beta, gamma)
        
    try:
        path = nx.dijkstra_path(G, source, target, weight=weight_func)
        cost = sum(weight_func(path[i], path[i+1], G[path[i]][path[i+1]]) for i in range(len(path)-1))
        return path, cost
    except nx.NetworkXNoPath:
        return None
    except nx.NodeNotFound:
        return None
'''

files['d:/SafeRoute/backend/app/core/routing/graph_builder.py'] = '''"""
Graph Builder
"""
import networkx as nx
import logging
from scipy.spatial import cKDTree
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.models.base import async_session_factory

logger = logging.getLogger(__name__)

class GraphBuilder:
    def __init__(self):
        self.G = nx.DiGraph()
        self.kd_tree = None
        self.node_mapping = []

    async def build_graph(self):
        async with async_session_factory() as db:
            logger.info("Loading nodes...")
            res = await db.execute(text("SELECT node_id, ST_Y(geom) as lat, ST_X(geom) as lng FROM nodes"))
            nodes = res.fetchall()
            
            node_coords = []
            for row in nodes:
                self.G.add_node(row.node_id, lat=row.lat, lng=row.lng)
                node_coords.append((row.lat, row.lng))
                self.node_mapping.append(row.node_id)
                
            if node_coords:
                self.kd_tree = cKDTree(node_coords)
                
            logger.info("Loading edges...")
            res = await db.execute(text("""
                SELECT segment_id, start_node, end_node, length_m, safety_score, 
                       cctv_score, crowd_score, lighting_score, emergency_score, crime_penalty, ST_AsGeoJSON(geom) as geojson
                FROM road_segments
            """))
            edges = res.fetchall()
            
            for row in edges:
                data = {
                    "segment_id": row.segment_id,
                    "distance_m": row.length_m,
                    "travel_time_s": row.length_m / 11.11, # ~40km/h
                    "safety_score": row.safety_score,
                    "cctv_score": row.cctv_score,
                    "crowd_score": row.crowd_score,
                    "lighting_score": row.lighting_score,
                    "emergency_score": row.emergency_score,
                    "crime_penalty": row.crime_penalty,
                    "geojson": row.geojson
                }
                self.G.add_edge(row.start_node, row.end_node, **data)
                
            logger.info(f"Graph loaded with {self.G.number_of_nodes()} nodes and {self.G.number_of_edges()} edges")

    def snap_to_nearest_node(self, lat: float, lng: float) -> int:
        if not self.kd_tree: return None
        dist, idx = self.kd_tree.query((lat, lng))
        return self.node_mapping[idx]
'''

files['d:/SafeRoute/backend/app/core/routing/route_service.py'] = '''"""
Route Service
"""
import uuid
import json
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.routing.graph_builder import GraphBuilder
from app.core.routing.yen_k_shortest import yen_k_shortest_paths
from app.schemas.route import RouteRequest, RouteOptionsResponse, RouteResponse, Coordinates

class RouteService:
    def __init__(self, graph_builder: GraphBuilder):
        self.graph_builder = graph_builder

    async def compute_routes(self, db: AsyncSession, source: Coordinates, dest: Coordinates) -> RouteOptionsResponse:
        start_node = self.graph_builder.snap_to_nearest_node(source.lat, source.lng)
        end_node = self.graph_builder.snap_to_nearest_node(dest.lat, dest.lng)
        
        if not start_node or not end_node:
            return None
            
        timestamp = datetime.utcnow()
        paths = yen_k_shortest_paths(self.graph_builder.G, start_node, end_node, timestamp, k=3)
        
        if not paths:
            return None
            
        routes = []
        for path_nodes, cost in paths:
            features = []
            total_dist = 0
            total_time = 0
            unsafe_count = 0
            score_sum = 0
            
            for i in range(len(path_nodes)-1):
                u = path_nodes[i]
                v = path_nodes[i+1]
                edge_data = self.graph_builder.G[u][v]
                
                total_dist += edge_data["distance_m"]
                total_time += edge_data.get("travel_time_s", 0)
                score = edge_data.get("safety_score", 50)
                score_sum += score * edge_data["distance_m"]
                
                if score < 50:
                    unsafe_count += 1
                    
                geojson_str = edge_data.get("geojson")
                if geojson_str:
                    geom = json.loads(geojson_str)
                    features.append({
                        "type": "Feature",
                        "geometry": geom,
                        "properties": {
                            "segment_id": edge_data.get("segment_id"),
                            "safety_score": score
                        }
                    })
                    
            avg_score = score_sum / total_dist if total_dist > 0 else 50
            
            r = RouteResponse(
                route_id=uuid.uuid4(),
                geojson={"type": "FeatureCollection", "features": features},
                safety_score=avg_score,
                distance_m=total_dist,
                eta_seconds=int(total_time),
                segment_count=len(path_nodes)-1,
                unsafe_segment_count=unsafe_count,
                safety_label=RouteResponse.compute_safety_label(avg_score)
            )
            routes.append(r)
            
        return RouteOptionsResponse(routes=routes, computed_at=timestamp)
'''

files['d:/SafeRoute/backend/app/core/routing/yen_k_shortest.py'] = '''"""
Yen's K-Shortest Paths
"""
import networkx as nx
from typing import List, Tuple
from datetime import datetime
from app.core.routing.dijkstra import dijkstra_safest_route

def yen_k_shortest_paths(
    G: nx.DiGraph,
    source: int,
    target: int,
    timestamp: datetime,
    k: int = 3
) -> List[Tuple[List[int], float]]:
    
    A = []
    B = []
    
    first_path = dijkstra_safest_route(G, source, target, timestamp)
    if not first_path:
        return []
        
    A.append(first_path)
    
    for k_idx in range(1, k):
        prev_path = A[k_idx-1][0]
        
        for i in range(len(prev_path) - 1):
            spur_node = prev_path[i]
            root_path = prev_path[:i+1]
            
            removed_edges = []
            for p, _ in A:
                if len(p) > i and p[:i+1] == root_path:
                    u, v = p[i], p[i+1]
                    if G.has_edge(u, v):
                        edge_data = G[u][v].copy()
                        removed_edges.append((u, v, edge_data))
                        G.remove_edge(u, v)
                        
            spur_path = dijkstra_safest_route(G, spur_node, target, timestamp)
            
            for u, v, edge_data in removed_edges:
                G.add_edge(u, v, **edge_data)
                
            if spur_path:
                total_path = root_path[:-1] + spur_path[0]
                
                def edge_cost_func(data):
                    from app.core.routing.cost_function import edge_cost
                    return edge_cost(data, timestamp)
                    
                total_cost = sum(edge_cost_func(G[total_path[j]][total_path[j+1]]) for j in range(len(total_path)-1))
                
                path_entry = (total_path, total_cost)
                if path_entry not in B:
                    B.append(path_entry)
                    
        if not B:
            break
            
        B.sort(key=lambda x: x[1])
        A.append(B.pop(0))
        
    return A
'''

files['d:/SafeRoute/backend/app/core/routing/cost_function.py'] = '''"""
Cost Function
"""
from datetime import datetime
from app.core.scoring.score_engine import SafetyScoreEngine

def edge_cost(edge_data: dict, timestamp: datetime, alpha: float = 0.8, beta: float = 0.1, gamma: float = 0.1) -> float:
    dist = edge_data.get("distance_m", 1.0)
    time_s = edge_data.get("travel_time_s", 1.0)
    score = edge_data.get("safety_score", 50.0)
    
    multiplier = SafetyScoreEngine.time_multiplier(timestamp)
    adjusted_score = score * multiplier
    
    # Cost is inversely proportional to safety score
    safety_penalty = 100.0 / (adjusted_score + 1e-6)
    
    cost = (alpha * safety_penalty * dist) + (beta * dist) + (gamma * time_s)
    return cost
'''

files['d:/SafeRoute/backend/app/core/scoring/crime_scorer.py'] = '''"""Crime Scorer"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from sqlalchemy import func as geo_func

class CrimeScorer:
    def __init__(self, db: AsyncSession):
        self.db = db
        
    async def compute_penalty(self, segment_id: int, geom_wkt: str) -> float:
        # Crime penalty based on incidents near segment
        return 0.0
'''

files['d:/SafeRoute/backend/app/core/scoring/crowd_scorer.py'] = '''"""Crowd Scorer"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from sqlalchemy import func as geo_func

class CrowdScorer:
    def __init__(self, db: AsyncSession):
        self.db = db
        
    async def compute_score(self, segment_id: int, geom_wkt: str) -> float:
        return 50.0
'''

files['d:/SafeRoute/backend/app/core/scoring/emergency_scorer.py'] = '''"""Emergency Scorer"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from sqlalchemy import func as geo_func

class EmergencyScorer:
    def __init__(self, db: AsyncSession):
        self.db = db
        
    async def compute_score(self, segment_id: int, geom_wkt: str) -> float:
        return 50.0
'''

files['d:/SafeRoute/backend/app/core/scoring/score_engine.py'] = '''"""
Safety Score Engine
"""
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession

class SafetyScoreEngine:
    def __init__(self, db: AsyncSession):
        self.db = db
        
    @staticmethod
    def time_multiplier(timestamp: datetime) -> float:
        hour = timestamp.hour
        if 8 <= hour < 20:
            return 1.0
        elif 20 <= hour < 22:
            return 0.85
        elif 22 <= hour or hour < 5:
            return 0.65
        else:
            return 0.85
            
    async def recompute_all(self):
        pass
'''

files['d:/SafeRoute/backend/app/core/sos/sos_service.py'] = '''"""SOS Service"""
import logging
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.auth.sms_client import SMSClient
from app.models.user import User

logger = logging.getLogger(__name__)

class SOSService:
    def __init__(self, sms_client: SMSClient):
        self.sms_client = sms_client
        
    async def trigger_sos(self, db: AsyncSession, user: User, lat: float, lng: float) -> dict:
        contacts = user.emergency_contacts or []
        for contact in contacts:
            phone = contact.get("phone")
            if phone:
                await self.sms_client.send_message(phone, f"SOS Alert! I need help at lat: {lat}, lng: {lng}")
        return {"status": "triggered"}
'''

files['d:/SafeRoute/backend/app/workers/crime_ingest.py'] = '''"""Crime Ingest Worker"""
import logging
logger = logging.getLogger(__name__)

def ingest_crime_data():
    logger.info("Ingesting crime data")
'''

import os
for path, content in files.items():
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Wrote {path}")
