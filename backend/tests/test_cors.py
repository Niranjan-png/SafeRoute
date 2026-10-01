"""CORS focused tests."""


class TestCORS:
    def test_explicit_methods_defined(self):
        code = open("backend/app/main.py").read()
        assert 'allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]' in code

    def test_explicit_headers_defined(self):
        code = open("backend/app/main.py").read()
        assert '"Authorization"' in code
        assert '"Content-Type"' in code

    def test_origins_from_config(self):
        code = open("backend/app/main.py").read()
        assert "allow_origins=settings.cors_origins_list" in code
