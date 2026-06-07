"""Pydantic schemas for routing endpoints."""

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
