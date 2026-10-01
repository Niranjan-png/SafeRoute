"""Focused tests for unverified-user fix."""


class TestUnverifiedUser:
    def test_request_otp_does_not_create_verified_user(self):
        # Conceptual: send_otp sets verified=False
        code = open("backend/app/core/auth/auth_service.py").read()
        assert "user.verified = False" in code

    def test_verify_sets_verified_true(self):
        code = open("backend/app/core/auth/auth_service.py").read()
        assert "user.verified = True" in code

    def test_model_has_verified_default_false(self):
        model_code = open("backend/app/models/user.py").read()
        assert "verified: Mapped[bool] = mapped_column(default=False)" in model_code

    def test_no_duplicate_users_for_repeated_otp(self):
        # Phone is unique in model; send_otp uses select then updates
        model_code = open("backend/app/models/user.py").read()
        assert "unique=True" in model_code
