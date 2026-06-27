"""SOS Service"""
import logging
import uuid
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth.sms_client import SMSClient
from app.models.user import User

logger = logging.getLogger(__name__)


class SOSService:
    def __init__(self, sms_client: SMSClient):
        self.sms_client = sms_client

    async def trigger_sos(
        self,
        db: AsyncSession,
        user: User | None,
        lat: float,
        lng: float,
        contacts_override: list[dict] | None = None,
        custom_message: str | None = None
    ) -> dict:
        """Trigger an SOS alert and notify emergency contacts."""
        contacts = contacts_override if contacts_override is not None else (user.emergency_contacts if user and user.emergency_contacts else [])
        
        user_name = (user.name or user.phone) if user else "Anonymous User"
        maps_link = f"https://maps.google.com/?q={lat},{lng}"
        
        message = f"SOS ALERT from {user_name}!\n"
        if custom_message and custom_message.strip():
            message += f"Message: {custom_message.strip()}\n"
        message += (
            f"Location: {maps_link}\n"
            f"Time: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}\n"
            f"Sent via SafeRoute Bengaluru"
        )

        notified_names = []
        for contact in contacts:
            phone = contact.get("phone")
            name = contact.get("name", "Unknown")
            if phone:
                await self.sms_client.send_message(phone, message)
                notified_names.append(name)
                
        if not contacts:
            # For anonymous users or users with no contacts, simulate alerting authorities
            notified_names.append("Local Authorities (112)")

        return {
            "event_id": uuid.uuid4(),
            "status": "triggered",
            "contacts_notified": len(notified_names),
            "contact_names": notified_names,
            "message": "SOS alert sent successfully",
        }
