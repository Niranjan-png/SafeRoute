"""Road network node model — intersections, metro stations, bus stops, junctions."""

from geoalchemy2 import Geometry
from sqlalchemy import BigInteger, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Node(Base):
    __tablename__ = "nodes"

    node_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    geom: Mapped[str] = mapped_column(
        Geometry(geometry_type="POINT", srid=4326),
        nullable=False,
    )
    node_type: Mapped[str | None] = mapped_column(String(30))  # intersection, metro, bus_stop, junction
    area_name: Mapped[str | None] = mapped_column(String(100))
