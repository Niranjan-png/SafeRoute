"""
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
        try:
            await graph_builder.build_graph()
        except Exception as e:
            logger.error(f"Failed to build graph: {e}")
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
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Authorization", "Content-Type", "Accept", "X-Requested-With"],
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "version": settings.app_version,
        "graph_loaded": graph_builder.G is not None and len(graph_builder.G) > 0,
        "graph_nodes": graph_builder.G.number_of_nodes() if graph_builder.G else 0,
        "graph_edges": graph_builder.G.number_of_edges() if graph_builder.G else 0,
    }
