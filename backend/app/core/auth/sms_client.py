"""
SMS Client
"""
import logging
import asyncio
from twilio.rest import Client

logger = logging.getLogger(__name__)


class SMSClient:
    async def send_message(self, phone: str, message: str) -> bool:
        logger.info(f"SMS to {phone}: {message}")
        return True

    async def send_otp(self, phone: str, otp: str) -> bool:
        logger.info(f"SMS OTP to {phone}: {otp}")
        return True


class MockSMSClient(SMSClient):
    async def send_message(self, phone: str, message: str) -> bool:
        logger.info(f"MOCK SMS to {phone}: {message}")
        return True

    async def send_otp(self, phone: str, otp: str) -> bool:
        logger.info(f"MOCK OTP to {phone}: {otp}")
        return True


class TwilioSMSClient(SMSClient):
    def __init__(self, account_sid: str, auth_token: str, from_phone: str):
        self.account_sid = account_sid
        self.auth_token = auth_token
        self.from_phone = from_phone
        self.client = Client(account_sid, auth_token)

    async def send_message(self, phone: str, message: str) -> bool:
        try:
            def _send():
                self.client.messages.create(
                    body=message,
                    from_=self.from_phone,
                    to=phone
                )
            await asyncio.to_thread(_send)
            logger.info(f"TWILIO SMS successfully sent to {phone}")
            return True
        except Exception as e:
            logger.error(f"Failed to send Twilio SMS to {phone}: {e}")
            return False

    async def send_otp(self, phone: str, otp: str) -> bool:
        message = f"Your SafeRoute verification code is: {otp}"
        return await self.send_message(phone, message)


class TwilioWhatsAppClient(SMSClient):
    def __init__(self, account_sid: str, auth_token: str, from_phone: str):
        self.account_sid = account_sid
        self.auth_token = auth_token
        # Twilio WhatsApp requires from number to have "whatsapp:" prefix
        self.from_phone = from_phone if from_phone.startswith("whatsapp:") else f"whatsapp:{from_phone}"
        self.client = Client(account_sid, auth_token)

    async def send_message(self, phone: str, message: str) -> bool:
        try:
            # Twilio WhatsApp requires recipient number to have "whatsapp:" prefix
            to_phone = phone if phone.startswith("whatsapp:") else f"whatsapp:{phone}"
            def _send():
                self.client.messages.create(
                    body=message,
                    from_=self.from_phone,
                    to=to_phone
                )
            await asyncio.to_thread(_send)
            logger.info(f"TWILIO WhatsApp message successfully sent to {phone}")
            return True
        except Exception as e:
            logger.error(f"Failed to send Twilio WhatsApp to {phone}: {e}")
            return False

    async def send_otp(self, phone: str, otp: str) -> bool:
        message = f"Your SafeRoute verification code is: {otp}"
        return await self.send_message(phone, message)


def get_sms_client() -> SMSClient:
    """Factory function to get the configured SMS client."""
    from app.config import settings
    if settings.sms_backend == "twilio":
        return TwilioSMSClient(
            account_sid=settings.twilio_account_sid,
            auth_token=settings.twilio_auth_token,
            from_phone=settings.twilio_phone_number
        )
    elif settings.sms_backend == "twilio_whatsapp":
        return TwilioWhatsAppClient(
            account_sid=settings.twilio_account_sid,
            auth_token=settings.twilio_auth_token,
            from_phone=settings.twilio_phone_number
        )
    elif settings.sms_backend == "mock":
        return MockSMSClient()
    return SMSClient()

