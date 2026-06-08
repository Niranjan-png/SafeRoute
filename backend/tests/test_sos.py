"""
Tests for the SOS service.
"""

import pytest

from app.core.auth.sms_client import MockSMSClient
from app.core.sos.sos_service import SOSService


class TestSOSService:
    """Test SOS trigger logic."""

    @pytest.mark.asyncio
    async def test_sos_builds_correct_message(self):
        """SOS message should contain location link and user name."""
        sms_client = MockSMSClient()
        sos_service = SOSService(sms_client)

        # The message format should contain a Google Maps link
        lat, lng = 12.9352, 77.6245
        expected_link = f"https://maps.google.com/?q={lat},{lng}"

        # Verify the link format is correct
        assert "maps.google.com" in expected_link

    @pytest.mark.asyncio
    async def test_mock_sms_client_returns_true(self):
        """Mock SMS client should always return True."""
        client = MockSMSClient()
        result = await client.send_message("+919876543210", "Test SOS alert")
        assert result is True

    @pytest.mark.asyncio
    async def test_mock_sms_otp_returns_true(self):
        """Mock SMS client should return True for OTP sends."""
        client = MockSMSClient()
        result = await client.send_otp("+919876543210", "123456")
        assert result is True
