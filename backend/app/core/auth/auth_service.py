"""
Authentication Service
"""

import uuid
from datetime import datetime, timedelta

import jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import settings
from app.models.user import User
from app.core.auth.sms_client import SMSClient
from app.schemas.auth import TokenResponse


class AuthService:
    def __init__(self, sms_client: SMSClient):
        self.sms_client = sms_client

    async def send_otp(self, db: AsyncSession, phone: str) -> dict:
        # Mock OTP generation for MVP
        otp = "123456"

        result = await db.execute(select(User).where(User.phone == phone))
        user = result.scalar_one_or_none()

        if not user:
            user = User(phone=phone)
            db.add(user)

        user.hashed_otp = otp  # In real app, hash it
        user.otp_expires_at = datetime.utcnow() + timedelta(minutes=5)
        await db.commit()

        await self.sms_client.send_message(phone, f"Your SafeRoute OTP is {otp}")
        return {"message": "OTP sent successfully"}

    async def verify_otp(self, db: AsyncSession, phone: str, otp: str) -> TokenResponse:
        result = await db.execute(select(User).where(User.phone == phone))
        user = result.scalar_one_or_none()

        if not user or user.hashed_otp != otp or user.otp_expires_at < datetime.utcnow():
            from fastapi import HTTPException
            raise HTTPException(status_code=400, detail="Invalid or expired OTP")

        user.hashed_otp = None
        user.otp_expires_at = None
        await db.commit()

        access_token = self.create_access_token(data={"sub": str(user.user_id)})
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=settings.jwt_access_token_expire_minutes * 60,
        )

    def create_access_token(self, data: dict) -> str:
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(minutes=settings.jwt_access_token_expire_minutes)
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
