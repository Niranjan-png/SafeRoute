"""Emergency facility model — police stations, hospitals, women help centers, etc."""

import uuid

from geoalchemy2 import Geometry
from sqlalchemy import Boolean, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class EmergencyFacility(Base):
    __tablename__ = "emergency_facilities"

    facility_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    geom: Mapped[str] = mapped_column(
        Geometry(geometry_type="POINT", srid=4326),
        nullable=False,
    )
    facility_type: Mapped[str | None] = mapped_column(String(50))  # police_station, women_police, hospital, namma_112_post
    name: Mapped[str | None] = mapped_column(String(200))
    phone: Mapped[str | None] = mapped_column(String(20))
    is_24hr: Mapped[bool] = mapped_column(Boolean, default=False)
