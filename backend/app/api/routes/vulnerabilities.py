"""Vulnerability management CRUD + asset attachment endpoints."""

import uuid
from math import ceil

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.postgres import get_db
from app.models.user import User
from app.models.vulnerability import Severity, VulnStatus
from app.schemas.vulnerability import (
    VulnerabilityCreate,
    VulnerabilityPage,
    VulnerabilityRead,
    VulnerabilityUpdate,
)
from app.services import asset_service, vulnerability_service

router = APIRouter(prefix="/vulnerabilities", tags=["vulnerabilities"])


@router.get("", response_model=VulnerabilityPage)
async def list_vulnerabilities(
    search: str | None = Query(None, description="Match CVE id, title, or description"),
    severity: Severity | None = None,
    status: VulnStatus | None = None,
    asset_id: uuid.UUID | None = Query(None, description="Only vulns affecting this asset"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> VulnerabilityPage:
    """List vulnerabilities with search, severity/status filters, and paging."""
    items, total = await vulnerability_service.list_vulnerabilities(
        db,
        search=search,
        severity=severity,
        status=status,
        asset_id=asset_id,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )
    return VulnerabilityPage(
        items=[VulnerabilityRead.model_validate(v) for v in items],
        total=total,
        page=page,
        page_size=page_size,
        pages=ceil(total / page_size) if total else 0,
    )


@router.post("", response_model=VulnerabilityRead, status_code=status.HTTP_201_CREATED)
async def create_vulnerability(
    payload: VulnerabilityCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> VulnerabilityRead:
    """Create a vulnerability, optionally attaching affected assets."""
    vuln = await vulnerability_service.create_vulnerability(db, payload)
    return VulnerabilityRead.model_validate(vuln)


async def _get_or_404(db: AsyncSession, vuln_id: uuid.UUID):
    """Fetch a vulnerability or raise 404."""
    vuln = await vulnerability_service.get_vulnerability(db, vuln_id)
    if vuln is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Vulnerability not found")
    return vuln


@router.get("/{vuln_id}", response_model=VulnerabilityRead)
async def get_vulnerability(
    vuln_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> VulnerabilityRead:
    """Fetch a single vulnerability's details."""
    return VulnerabilityRead.model_validate(await _get_or_404(db, vuln_id))


@router.patch("/{vuln_id}", response_model=VulnerabilityRead)
async def update_vulnerability(
    vuln_id: uuid.UUID,
    payload: VulnerabilityUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> VulnerabilityRead:
    """Partially update a vulnerability."""
    vuln = await _get_or_404(db, vuln_id)
    updated = await vulnerability_service.update_vulnerability(db, vuln, payload)
    return VulnerabilityRead.model_validate(updated)


@router.delete("/{vuln_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vulnerability(
    vuln_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> None:
    """Delete a vulnerability."""
    vuln = await _get_or_404(db, vuln_id)
    await vulnerability_service.delete_vulnerability(db, vuln)


@router.post("/{vuln_id}/assets/{asset_id}", response_model=VulnerabilityRead)
async def attach_asset(
    vuln_id: uuid.UUID,
    asset_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> VulnerabilityRead:
    """Attach an asset to a vulnerability."""
    vuln = await _get_or_404(db, vuln_id)
    asset = await asset_service.get_asset(db, asset_id)
    if asset is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Asset not found")
    updated = await vulnerability_service.attach_asset(db, vuln, asset)
    return VulnerabilityRead.model_validate(updated)


@router.delete("/{vuln_id}/assets/{asset_id}", response_model=VulnerabilityRead)
async def detach_asset(
    vuln_id: uuid.UUID,
    asset_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> VulnerabilityRead:
    """Detach an asset from a vulnerability."""
    vuln = await _get_or_404(db, vuln_id)
    updated = await vulnerability_service.detach_asset(db, vuln, asset_id)
    return VulnerabilityRead.model_validate(updated)
