"""SOS event log model — tracks every SOS trigger for analytics and resolution."""

import uuid
from datetime import datetime

from geoalchemy2 import Geometry
from sqlalchemy import ForeignKey, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class SOSEvent(Base):
    __tablename__ = "sos_events"

    event_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False
    )
    geom: Mapped[str] = mapped_column(
        Geometry(geometry_type="POINT", srid=4326),
        nullable=False,
    )
    triggered_at: Mapped[datetime] = mapped_column(default=func.now())
    contacts_notified: Mapped[dict] = mapped_column(JSONB, default=list)
    resolved_at: Mapped[datetime | None] = mapped_column()
