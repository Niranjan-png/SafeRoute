"""
Authentication Service
"""

import uuid
from datetime import datetime, timedelta

import secrets

import jwt
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import settings
from app.models.user import User
from app.core.auth.sms_client import SMSClient
from app.schemas.auth import TokenResponse

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Minimal Redis rate limiter (secure fallback if Redis unavailable)
try:
    import redis
    _redis_client = redis.Redis.from_url(settings.redis_url, decode_responses=True)
except Exception:
    _redis_client = None


def _rate_limit_request(key: str, max_requests: int, window_seconds: int) -> bool:
    if _redis_client is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=503, detail="Rate limit service unavailable")
    current = _redis_client.incr(key)
    if current == 1:
        _redis_client.expire(key, window_seconds)
    return current <= max_requests


def _rate_limit_fail(key: str, max_requests: int, window_seconds: int) -> bool:
    if _redis_client is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=503, detail="Rate limit service unavailable")
    current = _redis_client.incr(key)
    if current == 1:
        _redis_client.expire(key, window_seconds)
    return current <= max_requests


class AuthService:
    def __init__(self, sms_client: SMSClient):
        self.sms_client = sms_client

    async def send_otp(self, db: AsyncSession, phone: str) -> dict:
        # Rate limit: 3 requests per 5 minutes per phone
        if not _rate_limit_request(f"otp_request:{phone}", max_requests=3, window_seconds=300):
            from fastapi import HTTPException
            raise HTTPException(status_code=429, detail="Too many OTP requests. Try again later.")

        # Secure 6-digit OTP
        otp = str(secrets.randbelow(900000) + 100000)

        result = await db.execute(select(User).where(User.phone == phone))
        user = result.scalar_one_or_none()

        if not user:
            user = User(phone=phone)
            db.add(user)

        user.verified = False
        user.hashed_otp = pwd_context.hash(otp)
        user.otp_expires_at = datetime.utcnow() + timedelta(minutes=5)
        await db.commit()

        await self.sms_client.send_message(phone, f"Your SafeRoute OTP is {otp}")
        return {"message": "OTP sent successfully"}

    async def verify_otp(self, db: AsyncSession, phone: str, otp: str) -> TokenResponse:
        result = await db.execute(select(User).where(User.phone == phone))
        user = result.scalar_one_or_none()

        # Rate limit failed verification attempts (only count if hash exists and OTP incorrect)
        verification_failed = False
        if user and user.hashed_otp:
            try:
                verification_failed = not pwd_context.verify(otp, user.hashed_otp)
            except Exception:
                verification_failed = True
        else:
            verification_failed = True

        if verification_failed:
            if not _rate_limit_fail(f"otp_verify_fail:{phone}", max_requests=5, window_seconds=300):
                from fastapi import HTTPException
                raise HTTPException(status_code=429, detail="Too many failed verification attempts. Try again later.")

        if not user or not user.hashed_otp or not pwd_context.verify(otp, user.hashed_otp) or user.otp_expires_at < datetime.utcnow():
            from fastapi import HTTPException
            raise HTTPException(status_code=400, detail="Invalid or expired OTP")

        user.hashed_otp = None
        user.otp_expires_at = None
        user.verified = True
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
