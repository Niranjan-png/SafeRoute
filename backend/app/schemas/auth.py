"""Pydantic schemas for authentication endpoints."""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class OTPRequest(BaseModel):
    """Request body for OTP generation."""
    phone: str = Field(..., min_length=10, max_length=15, description="Phone number with country code, e.g., +919876543210")


class OTPVerifyRequest(BaseModel):
    """Request body for OTP verification."""
    phone: str = Field(..., min_length=10, max_length=15)
    otp: str = Field(..., min_length=6, max_length=6, description="6-digit OTP")


class TokenResponse(BaseModel):
    """JWT token response after successful authentication."""
    access_token: str
    token_type: str = "bearer"
    expires_in: int = Field(..., description="Token expiry in seconds")


class UserResponse(BaseModel):
    """User profile response."""
    user_id: uuid.UUID
    phone: str
    name: str | None = None
    emergency_contacts: list[dict] = Field(default_factory=list)
    preferences: dict = Field(default_factory=dict)
    created_at: datetime


class UserUpdateRequest(BaseModel):
    """Request body for updating user profile."""
    name: str | None = Field(default=None, max_length=100)
    emergency_contacts: list[dict] | None = None
    preferences: dict | None = None


class EmergencyContact(BaseModel):
    """Schema for an emergency contact."""
    name: str = Field(..., max_length=100)
    phone: str = Field(..., min_length=10, max_length=15)
    relationship: str | None = Field(default=None, max_length=50)
