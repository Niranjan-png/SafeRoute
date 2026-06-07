"""
Authentication Endpoints
"""

from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth.auth_service import AuthService
from app.core.auth.sms_client import SMSClient
from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.auth import OTPRequest, OTPVerifyRequest, TokenResponse

router = APIRouter()
sms_client = SMSClient()
auth_service = AuthService(sms_client=sms_client)


@router.post("/request-otp")
async def send_otp(request: OTPRequest, db: AsyncSession = Depends(get_db)):
    result = await auth_service.send_otp(db, request.phone)
    return {"message": result["message"], "phone": request.phone}


@router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp(request: OTPVerifyRequest, db: AsyncSession = Depends(get_db)):
    return await auth_service.verify_otp(db, request.phone, request.otp)


@router.post("/token", response_model=TokenResponse, include_in_schema=False)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: AsyncSession = Depends(get_db)
):
    """
    OAuth2 compatible token login, required for Swagger UI.
    Maps username -> phone, password -> otp.
    """
    # Swagger UI form-encoding converts '+' to ' '
    phone = form_data.username.replace(" ", "+") if form_data.username.startswith(" ") else form_data.username
    return await auth_service.verify_otp(db, phone, form_data.password)


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {"user_id": str(current_user.user_id), "phone": current_user.phone, "name": current_user.name}
