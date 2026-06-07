"""Streetlight location model — for lighting score computation."""

import uuid

from geoalchemy2 import Geometry
from sqlalchemy import Boolean, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Streetlight(Base):
    __tablename__ = "streetlights"

    light_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    geom: Mapped[str] = mapped_column(
        Geometry(geometry_type="POINT", srid=4326),
        nullable=False,
    )
    source: Mapped[str | None] = mapped_column(String(50))  # bbmp, simulated
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
