"""Security findings CRUD, dashboard stats, and auto-generation endpoints."""

import uuid
from math import ceil

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.postgres import get_db
from app.models.finding import FindingType
from app.models.user import User
from app.models.vulnerability import Severity, VulnStatus
from app.schemas.finding import (
    FindingCreate,
    FindingPage,
    FindingRead,
    FindingStats,
    FindingUpdate,
    GenerateResult,
)
from app.services import asset_service, finding_service

router = APIRouter(prefix="/findings", tags=["findings"])


@router.get("", response_model=FindingPage)
async def list_findings(
    search: str | None = Query(None, description="Match title, description, or MITRE technique id"),
    finding_type: FindingType | None = None,
    severity: Severity | None = None,
    status: VulnStatus | None = None,
    asset_id: uuid.UUID | None = None,
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> FindingPage:
    """List findings with search, filters, severity sort, and pagination."""
    items, total = await finding_service.list_findings(
        db,
        search=search,
        finding_type=finding_type,
        severity=severity,
        status=status,
        asset_id=asset_id,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )
    return FindingPage(
        items=[FindingRead.model_validate(f) for f in items],
        total=total,
        page=page,
        page_size=page_size,
        pages=ceil(total / page_size) if total else 0,
    )


@router.get("/stats", response_model=FindingStats)
async def get_stats(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> FindingStats:
    """Aggregate counts (severity/status/type) for the findings dashboard."""
    return await finding_service.get_stats(db)


@router.post("/generate", response_model=GenerateResult)
async def generate_findings(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> GenerateResult:
    """Scan all assets and auto-generate findings from their risk factors."""
    created = await finding_service.generate_findings(db)
    msg = f"Generated {created} new finding(s)." if created else "No new findings — everything is already tracked."
    return GenerateResult(created=created, message=msg)


@router.post("", response_model=FindingRead, status_code=status.HTTP_201_CREATED)
async def create_finding(
    payload: FindingCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> FindingRead:
    """Create a finding against an existing asset."""
    if await asset_service.get_asset(db, payload.asset_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Affected asset not found")
    finding = await finding_service.create_finding(db, payload)
    return FindingRead.model_validate(finding)


async def _get_or_404(db: AsyncSession, finding_id: uuid.UUID):
    finding = await finding_service.get_finding(db, finding_id)
    if finding is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Finding not found")
    return finding


@router.get("/{finding_id}", response_model=FindingRead)
async def get_finding(
    finding_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> FindingRead:
    """Fetch a single finding."""
    return FindingRead.model_validate(await _get_or_404(db, finding_id))


@router.patch("/{finding_id}", response_model=FindingRead)
async def update_finding(
    finding_id: uuid.UUID,
    payload: FindingUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> FindingRead:
    """Partially update a finding (e.g. change status during triage)."""
    finding = await _get_or_404(db, finding_id)
    if payload.asset_id is not None and await asset_service.get_asset(db, payload.asset_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Affected asset not found")
    updated = await finding_service.update_finding(db, finding, payload)
    return FindingRead.model_validate(updated)


@router.delete("/{finding_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_finding(
    finding_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> None:
    """Delete a finding."""
    finding = await _get_or_404(db, finding_id)
    await finding_service.delete_finding(db, finding)


@router.get("/catalog/templates")
async def get_catalog(_: User = Depends(get_current_user)) -> dict:
    """Expose finding templates (defaults + MITRE mapping) for the create form."""
    from app.services.finding_catalog import CATALOG

    return {
        ftype.value: {
            "title": tpl.title,
            "severity": tpl.severity.value,
            "description": tpl.description,
            "recommendation": tpl.recommendation,
            "mitre_tactic": tpl.mitre_tactic,
            "mitre_technique_id": tpl.mitre_technique_id,
            "mitre_technique_name": tpl.mitre_technique_name,
        }
        for ftype, tpl in CATALOG.items()
    }
