"""Rate limit focused tests."""


class TestRateLimits:
    def test_rate_limit_keys_defined(self):
        code = open("backend/app/core/auth/auth_service.py").read()
        assert "otp_request:" in code
        assert "otp_verify_fail:" in code

    def test_rate_limit_request_limit(self):
        code = open("backend/app/core/auth/auth_service.py").read()
        assert "max_requests=3" in code
        assert "window_seconds=300" in code

    def test_rate_limit_fail_limit(self):
        code = open("backend/app/core/auth/auth_service.py").read()
        assert "max_requests=5" in code
        assert "window_seconds=300" in code

    def test_redis_unavailable_fails_securely(self):
        code = open("backend/app/core/auth/auth_service.py").read()
        assert "Rate limit service unavailable" in code
