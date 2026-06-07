"""User model — phone-based auth with emergency contacts."""

import uuid
from datetime import datetime

from sqlalchemy import String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class User(Base):
    __tablename__ = "users"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    phone: Mapped[str] = mapped_column(String(15), unique=True, nullable=False)
    name: Mapped[str | None] = mapped_column(String(100))
    emergency_contacts: Mapped[dict] = mapped_column(JSONB, default=list)
    preferences: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(default=func.now())

    # OTP fields — stored hashed, cleared after verification
    hashed_otp: Mapped[str | None] = mapped_column(String(128))
    otp_expires_at: Mapped[datetime | None] = mapped_column()
