"""Crime incident model — geo-tagged crime events with type and severity weighting."""

import uuid
from datetime import datetime

from geoalchemy2 import Geometry
from sqlalchemy import Boolean, Float, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class CrimeIncident(Base):
    __tablename__ = "crime_incidents"

    crime_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    geom: Mapped[str] = mapped_column(
        Geometry(geometry_type="POINT", srid=4326),
        nullable=False,
    )
    crime_type: Mapped[str | None] = mapped_column(String(50))  # harassment, stalking, assault, robbery, snatching
    crime_weight: Mapped[float] = mapped_column(Float, nullable=False)
    source: Mapped[str | None] = mapped_column(String(50))  # NCRB, community_report, news
    occurred_at: Mapped[datetime | None] = mapped_column()
    created_at: Mapped[datetime] = mapped_column(default=func.now())
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
