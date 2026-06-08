"""Road segment model — edges of the graph with safety attributes."""

from datetime import datetime

from geoalchemy2 import Geometry
from sqlalchemy import BigInteger, Boolean, Float, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class RoadSegment(Base):
    __tablename__ = "road_segments"

    segment_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    start_node: Mapped[int] = mapped_column(BigInteger, ForeignKey("nodes.node_id"), nullable=False)
    end_node: Mapped[int] = mapped_column(BigInteger, ForeignKey("nodes.node_id"), nullable=False)
    geom: Mapped[str] = mapped_column(
        Geometry(geometry_type="LINESTRING", srid=4326),
        nullable=False,
    )
    length_m: Mapped[float] = mapped_column(Float, nullable=False)
    road_name: Mapped[str | None] = mapped_column(String(200))
    road_type: Mapped[str | None] = mapped_column(String(50))  # primary, secondary, residential, footway
    is_bidirectional: Mapped[bool] = mapped_column(Boolean, default=True)

    # Safety attributes — updated by the score engine
    safety_score: Mapped[float] = mapped_column(Float, default=50.0)
    cctv_score: Mapped[float] = mapped_column(Float, default=0.0)
    crowd_score: Mapped[float] = mapped_column(Float, default=0.0)
    lighting_score: Mapped[float] = mapped_column(Float, default=0.0)
    emergency_score: Mapped[float] = mapped_column(Float, default=0.0)
    crime_penalty: Mapped[float] = mapped_column(Float, default=0.0)
    score_updated_at: Mapped[datetime] = mapped_column(default=func.now())
