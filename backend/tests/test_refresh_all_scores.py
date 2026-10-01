"""Focused refresh_all_scores naming test."""


class TestRefreshAlias:
    def test_refresh_all_scores_exists(self):
        code = open("backend/app/core/scoring/score_engine.py").read()
        assert "async def refresh_all_scores" in code

    def test_recompute_all_alias_exists(self):
        code = open("backend/app/core/scoring/score_engine.py").read()
        assert "recompute_all = refresh_all_scores" in code
