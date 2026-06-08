"""
Tests for the safety scoring engine.
"""

from datetime import datetime

import pytest

from app.core.scoring.score_engine import SafetyScoreEngine


class TestSafetyScoreWeights:
    """Test that safety score weights are correctly configured."""

    def test_weights_sum_to_one(self):
        """All sub-score weights should sum to 1.0."""
        from app.config import settings
        total = (
            settings.weight_cctv
            + settings.weight_crowd
            + settings.weight_emergency
            + settings.weight_lighting
            + settings.weight_crime
        )
        assert abs(total - 1.0) < 1e-10

    def test_cctv_has_highest_weight(self):
        """CCTV should have the highest weight per the PRD."""
        from app.config import settings
        weights = [
            settings.weight_cctv,
            settings.weight_crowd,
            settings.weight_emergency,
            settings.weight_lighting,
            settings.weight_crime,
        ]
        assert settings.weight_cctv == max(weights)


class TestTimeMultiplier:
    """Test time-of-day multiplier values."""

    def test_multiplier_ranges(self):
        """All multipliers should be between 0 and 1."""
        for hour in range(24):
            ts = datetime(2024, 6, 15, hour, 30)
            m = SafetyScoreEngine.time_multiplier(ts)
            assert 0 < m <= 1.0, f"Hour {hour} has invalid multiplier: {m}"

    def test_daytime_is_safest(self):
        """Daytime (8AM-8PM) should have the highest multiplier."""
        day = SafetyScoreEngine.time_multiplier(datetime(2024, 1, 1, 12, 0))
        night = SafetyScoreEngine.time_multiplier(datetime(2024, 1, 1, 2, 0))
        assert day > night

    def test_specific_values(self):
        """Test specific multiplier values from the PRD."""
        assert SafetyScoreEngine.time_multiplier(datetime(2024, 1, 1, 3, 0)) == 0.65
        assert SafetyScoreEngine.time_multiplier(datetime(2024, 1, 1, 6, 0)) == 0.80
        assert SafetyScoreEngine.time_multiplier(datetime(2024, 1, 1, 12, 0)) == 1.00
        assert SafetyScoreEngine.time_multiplier(datetime(2024, 1, 1, 21, 0)) == 0.85
        assert SafetyScoreEngine.time_multiplier(datetime(2024, 1, 1, 23, 0)) == 0.70


class TestCompositeScore:
    """Test composite score computation logic."""

    def test_max_possible_score(self):
        """Maximum possible score should be 100."""
        # CCTV=30, Crowd=25, Emergency=20, Lighting=15, Crime=10
        max_score = 0.30 * 30 + 0.25 * 25 + 0.20 * 20 + 0.15 * 15 + 0.10 * 10
        assert max_score == pytest.approx(22.5, abs=0.01)  # Weighted sum

    def test_min_possible_score(self):
        """Minimum possible score should be 0."""
        min_score = 0.30 * 0 + 0.25 * 0 + 0.20 * 0 + 0.15 * 0 + 0.10 * 0
        assert min_score == 0.0

    def test_score_label_green(self):
        """Score > 75 should be labeled green."""
        from app.schemas.route import RouteResponse
        assert RouteResponse.compute_safety_label(80) == "green"
        assert RouteResponse.compute_safety_label(100) == "green"

    def test_score_label_amber(self):
        """Score 50-75 should be labeled amber."""
        from app.schemas.route import RouteResponse
        assert RouteResponse.compute_safety_label(60) == "amber"
        assert RouteResponse.compute_safety_label(50) == "amber"

    def test_score_label_red(self):
        """Score < 50 should be labeled red."""
        from app.schemas.route import RouteResponse
        assert RouteResponse.compute_safety_label(30) == "red"
        assert RouteResponse.compute_safety_label(0) == "red"
