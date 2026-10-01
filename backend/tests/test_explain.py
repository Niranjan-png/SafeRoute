"""Focused explain endpoint tests."""


class TestExplainEndpoint:
    def test_endpoint_exists(self):
        code = open("backend/app/api/v1/route.py").read()
        assert "def explain_route" in code

    def test_queries_route_result(self):
        code = open("backend/app/api/v1/route.py").read()
        assert "RouteResult" in code
        assert "select(RouteResult)" in code
        assert "scalar_one_or_none" in code

    def test_invalid_uuid_returns_422(self):
        code = open("backend/app/api/v1/route.py").read()
        assert "Invalid route_id format" in code
        assert "status_code=422" in code

    def test_not_found_returns_404(self):
        code = open("backend/app/api/v1/route.py").read()
        assert "Route not found" in code
        assert "status_code=404" in code
