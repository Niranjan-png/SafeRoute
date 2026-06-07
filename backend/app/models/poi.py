"""Point of Interest model — shops, restaurants, cafes, ATMs, petrol pumps from OSM."""

import uuid

from geoalchemy2 import Geometry
from sqlalchemy import Boolean, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class POI(Base):
    __tablename__ = "pois"

    poi_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    geom: Mapped[str] = mapped_column(
        Geometry(geometry_type="POINT", srid=4326),
        nullable=False,
    )
    poi_type: Mapped[str | None] = mapped_column(String(50))  # shop, restaurant, cafe, atm, petrol_pump
    name: Mapped[str | None] = mapped_column(String(200))
    is_24hr: Mapped[bool] = mapped_column(Boolean, default=False)
