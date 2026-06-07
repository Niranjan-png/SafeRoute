"""
SMS Client
"""
import logging

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


def get_sms_client() -> SMSClient:
    """Factory function to get the configured SMS client."""
    from app.config import settings
    if settings.sms_backend == "mock":
        return MockSMSClient()
    return SMSClient()

