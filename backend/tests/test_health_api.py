"""Integration tests for the Health API endpoints."""


class TestHealthEndpoint:
    """Verifies that the /health endpoint reports connectivity status gracefully."""

    def test_health_check_returns_200_and_dependency_status(self, client):
        response = client.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["postgres"] in ("up", "down")
        assert data["neo4j"] in ("up", "down")
