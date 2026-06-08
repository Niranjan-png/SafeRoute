"""Pydantic schemas for safety score and heatmap endpoints."""

from pydantic import BaseModel, Field


class BoundingBox(BaseModel):
    """Geographic bounding box for spatial queries."""
    min_lat: float = Field(..., ge=-90, le=90)
    min_lng: float = Field(..., ge=-180, le=180)
    max_lat: float = Field(..., ge=-90, le=90)
    max_lng: float = Field(..., ge=-180, le=180)


class SegmentScoreResponse(BaseModel):
    """Full safety score breakdown for a road segment."""
    segment_id: int
    road_name: str | None = None
    road_type: str | None = None
    safety_score: float = Field(..., ge=0, le=100)
    cctv_score: float
    crowd_score: float
    lighting_score: float
    emergency_score: float
    crime_penalty: float
    safety_label: str  # green, amber, red
    score_updated_at: str | None = None


class HeatmapRequest(BaseModel):
    """Query parameters for the safety heatmap endpoint."""
    bbox: BoundingBox
    min_zoom: int = Field(default=13, ge=10, le=18, description="Minimum zoom level to return segments")


class HeatmapFeature(BaseModel):
    """A single heatmap feature — simplified road segment with safety score."""
    segment_id: int
    safety_score: float
    safety_label: str
    geojson: dict  # GeoJSON geometry (LineString)


class HeatmapResponse(BaseModel):
    """GeoJSON FeatureCollection of road segments with safety scores."""
    type: str = "FeatureCollection"
    features: list[dict]
    total_segments: int
