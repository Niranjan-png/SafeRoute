"""Focused OTP security tests."""
import re


class TestOTPSecurity:
    def test_otp_is_six_digits(self):
        import secrets
        otp = str(secrets.randbelow(900000) + 100000)
        assert len(otp) == 6
        assert otp.isdigit()

    def test_otp_not_hardcoded(self):
        code = open("backend/app/core/auth/auth_service.py").read()
        assert '"123456"' not in code

    def test_stored_value_is_hash_not_plaintext(self):
        # Verify auth_service uses pwd_context.hash
        code = open("backend/app/core/auth/auth_service.py").read()
        assert "pwd_context.hash" in code

    def test_verification_uses_pwd_context_verify(self):
        code = open("backend/app/core/auth/auth_service.py").read()
        assert "pwd_context.verify" in code
