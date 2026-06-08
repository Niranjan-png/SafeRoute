"""Route result model — cached computed routes for explainability endpoint."""

import uuid
from datetime import datetime

from sqlalchemy import Float, ForeignKey, Integer, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class RouteResult(Base):
    __tablename__ = "route_results"

    route_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=True
    )
    source_lat: Mapped[float] = mapped_column(Float, nullable=False)
    source_lng: Mapped[float] = mapped_column(Float, nullable=False)
    dest_lat: Mapped[float] = mapped_column(Float, nullable=False)
    dest_lng: Mapped[float] = mapped_column(Float, nullable=False)
    route_geojson: Mapped[dict] = mapped_column(JSONB, nullable=False)
    safety_score: Mapped[float] = mapped_column(Float, nullable=False)
    distance_m: Mapped[float] = mapped_column(Float, nullable=False)
    eta_seconds: Mapped[int] = mapped_column(Integer, nullable=False)
    segment_scores: Mapped[dict] = mapped_column(JSONB, nullable=False)  # Per-segment breakdown
    computed_at: Mapped[datetime] = mapped_column(default=func.now())
    expires_at: Mapped[datetime | None] = mapped_column()
