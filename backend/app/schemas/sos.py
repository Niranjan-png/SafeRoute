"""Pydantic schemas for SOS endpoints."""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class SOSTriggerRequest(BaseModel):
    """Request body for triggering an SOS alert."""
    lat: float = Field(..., ge=-90, le=90, description="Current latitude")
    lng: float = Field(..., ge=-180, le=180, description="Current longitude")


class SOSTriggerResponse(BaseModel):
    """Response after SOS trigger."""
    event_id: uuid.UUID
    status: str = "triggered"
    contacts_notified: int = Field(..., description="Number of emergency contacts notified")
    contact_names: list[str] = Field(default_factory=list, description="Names of notified contacts")
    message: str = "SOS alert sent successfully"


class SOSEventResponse(BaseModel):
    """Full SOS event details."""
    event_id: uuid.UUID
    user_id: uuid.UUID
    lat: float
    lng: float
    triggered_at: datetime
    contacts_notified: list[dict]
    resolved_at: datetime | None = None
