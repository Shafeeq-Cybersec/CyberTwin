"""Aggregates all route modules under the versioned API prefix."""

from fastapi import APIRouter

from app.api.routes import (
    assets,
    auth,
    dashboard,
    findings,
    health,
    threat_intel,
    twin,
    vulnerabilities,
)

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(assets.router)
api_router.include_router(twin.router)
api_router.include_router(vulnerabilities.router)
api_router.include_router(findings.router)
api_router.include_router(dashboard.router)
api_router.include_router(threat_intel.router)

# Future phases: reports routers register here.
