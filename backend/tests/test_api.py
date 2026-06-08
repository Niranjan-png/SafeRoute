"""
Integration tests for API endpoints.
"""

import pytest
from httpx import ASGITransport, AsyncClient


class TestHealthEndpoint:
    """Test the health check endpoint."""

    @pytest.mark.asyncio
    async def test_health_check(self, client):
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "graph_loaded" in data
        assert "graph_nodes" in data


class TestAuthEndpoints:
    """Test authentication flow."""

    @pytest.mark.asyncio
    async def test_request_otp(self, client):
        """Should accept a phone number and send OTP."""
        response = await client.post(
            "/api/v1/auth/request-otp",
            json={"phone": "+919876543210"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["phone"] == "+919876543210"

    @pytest.mark.asyncio
    async def test_verify_invalid_otp(self, client):
        """Should reject an invalid OTP."""
        # First request OTP
        await client.post(
            "/api/v1/auth/request-otp",
            json={"phone": "+919876543211"},
        )
        # Try invalid OTP
        response = await client.post(
            "/api/v1/auth/verify-otp",
            json={"phone": "+919876543211", "otp": "000000"},
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_me_requires_auth(self, client):
        """/auth/me should require authentication."""
        response = await client.get("/api/v1/auth/me")
        assert response.status_code == 401


class TestRouteEndpoints:
    """Test routing endpoints."""

    @pytest.mark.asyncio
    async def test_route_options_requires_body(self, client):
        """Should return 422 for missing request body."""
        response = await client.post("/api/v1/route/options")
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_route_options_validates_coords(self, client):
        """Should validate coordinate ranges."""
        response = await client.post(
            "/api/v1/route/options",
            json={
                "source": {"lat": 200, "lng": 77.6},  # Invalid lat
                "destination": {"lat": 12.9, "lng": 77.6},
            },
        )
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_route_explain_not_found(self, client):
        """Should return 404 for non-existent route ID."""
        response = await client.get(
            "/api/v1/route/explain/00000000-0000-0000-0000-000000000000"
        )
        assert response.status_code == 404


class TestSafetyEndpoints:
    """Test safety score endpoints."""

    @pytest.mark.asyncio
    async def test_segment_score_not_found(self, client):
        """Should return 404 for non-existent segment."""
        response = await client.get("/api/v1/safety/score/999999")
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_heatmap_requires_bbox(self, client):
        """Heatmap endpoint requires bounding box parameters."""
        response = await client.get("/api/v1/safety/heatmap")
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_heatmap_with_bbox(self, client):
        """Heatmap should accept valid bounding box."""
        response = await client.get(
            "/api/v1/safety/heatmap",
            params={
                "min_lat": 12.9,
                "min_lng": 77.5,
                "max_lat": 13.0,
                "max_lng": 77.7,
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["type"] == "FeatureCollection"
        assert "features" in data


class TestReportEndpoints:
    """Test community report endpoints."""

    @pytest.mark.asyncio
    async def test_create_report_requires_auth(self, client):
        """Creating a report should require authentication."""
        response = await client.post(
            "/api/v1/report/create",
            json={
                "lat": 12.9352,
                "lng": 77.6245,
                "report_type": "harassment",
                "description": "Test report",
            },
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_nearby_reports(self, client):
        """Should return nearby reports (empty for clean DB)."""
        response = await client.get(
            "/api/v1/report/nearby",
            params={"lat": 12.9352, "lng": 77.6245},
        )
        assert response.status_code == 200
        data = response.json()
        assert "reports" in data
        assert "total" in data


class TestSafeZonesEndpoint:
    """Test safe zones endpoint."""

    @pytest.mark.asyncio
    async def test_nearby_safe_zones(self, client):
        """Should return safe zones near a location."""
        response = await client.get(
            "/api/v1/safe-zones/nearby",
            params={"lat": 12.9352, "lng": 77.6245},
        )
        assert response.status_code == 200
        data = response.json()
        assert "facilities" in data
        assert "total" in data

    @pytest.mark.asyncio
    async def test_filter_by_type(self, client):
        """Should accept facility type filter."""
        response = await client.get(
            "/api/v1/safe-zones/nearby",
            params={
                "lat": 12.9352,
                "lng": 77.6245,
                "types": "police_station,hospital",
            },
        )
        assert response.status_code == 200


class TestSOSEndpoint:
    """Test SOS endpoint."""

    @pytest.mark.asyncio
    async def test_sos_requires_auth(self, client):
        """SOS should require authentication."""
        response = await client.post(
            "/api/v1/sos/trigger",
            json={"lat": 12.9352, "lng": 77.6245},
        )
        assert response.status_code == 401
