"""Threat Intelligence endpoints: import feeds, correlate, browse."""

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.postgres import get_db
from app.models.threat_intel import ThreatSource
from app.models.user import User
from app.schemas.threat_intel import (
    AssetThreatMatch,
    CorrelationResult,
    ImportResult,
    ThreatIntelRead,
    ThreatStats,
)
from app.services import threat_intel_service

router = APIRouter(prefix="/threat-intel", tags=["threat-intel"])


@router.post("/import", response_model=ImportResult)
async def import_feeds(
    source: ThreatSource | None = Query(None, description="Import one source; omit for all"),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> ImportResult:
    """Import threat feeds. Without `source`, imports every source."""
    sources = [source] if source else list(ThreatSource)
    return await threat_intel_service.import_feeds(db, sources)


@router.post("/correlate", response_model=CorrelationResult)
async def correlate(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> CorrelationResult:
    """Map imported CVE/KEV threats to assets, auto-create findings, and
    raise CVSS so the Risk Engine recomputes affected assets' scores."""
    return await threat_intel_service.correlate(db)


@router.get("/stats", response_model=ThreatStats)
async def get_stats(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> ThreatStats:
    """Aggregate counts by source and KEV total."""
    return await threat_intel_service.get_stats(db)


@router.get("", response_model=list[ThreatIntelRead])
async def list_threats(
    source: ThreatSource | None = None,
    kev_only: bool = False,
    search: str | None = Query(None, description="Match external id or title"),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[ThreatIntelRead]:
    """Browse imported threat entries."""
    rows = await threat_intel_service.list_threats(db, source=source, kev_only=kev_only, search=search)
    return [ThreatIntelRead.model_validate(t) for t in rows]


@router.get("/asset/{asset_id}", response_model=list[AssetThreatMatch])
async def matches_for_asset(
    asset_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[AssetThreatMatch]:
    """Threats correlated to a specific asset (via its vulnerabilities)."""
    return await threat_intel_service.matches_for_asset(db, asset_id)
