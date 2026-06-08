"""Pydantic schemas for community safety report endpoints."""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class ReportCreateRequest(BaseModel):
    """Request body for creating a safety report."""
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
    report_type: str = Field(..., description="harassment, poor_lighting, suspicious_activity, unsafe_road")
    description: str | None = Field(default=None, max_length=1000)


class ReportResponse(BaseModel):
    """Response for a single safety report."""
    report_id: uuid.UUID
    lat: float
    lng: float
    report_type: str
    description: str | None = None
    created_at: datetime
    verified_count: int = 0
    is_active: bool = True


class ReportNearbyRequest(BaseModel):
    """Query parameters for finding nearby reports."""
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
    radius_m: float = Field(default=500, ge=50, le=5000, description="Search radius in meters")
    report_type: str | None = Field(default=None, description="Filter by report type")


class ReportListResponse(BaseModel):
    """Response with a list of nearby reports."""
    reports: list[ReportResponse]
    total: int
