"""Shared pytest fixtures for CyberTwin backend test suite."""

import uuid
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models.asset import Asset, AssetType, Criticality, AssetStatus


@pytest.fixture
def client():
    """FastAPI test client instance."""
    with TestClient(app) as test_client:
        yield test_client


def make_test_asset(**overrides) -> Asset:
    """Helper to instantiate an in-memory Asset instance with default safe values."""
    default_kwargs = {
        "id": uuid.uuid4(),
        "name": "Test Server",
        "hostname": "test-srv.corp.local",
        "ip_address": "10.0.1.50",
        "asset_type": AssetType.server,
        "operating_system": "Ubuntu 22.04 LTS",
        "owner": "SecOps Team",
        "department": "Engineering",
        "criticality": Criticality.medium,
        "status": AssetStatus.active,
        "tags": ["production", "internal"],
        "description": "Standard test asset",
        "cvss_score": 0.0,
        "internet_exposed": False,
        "missing_mfa": False,
        "weak_password": False,
        "misconfigured": False,
        "open_ports": 0,
        "business_importance": 1,
    }
    default_kwargs.update(overrides)
    return Asset(**default_kwargs)
