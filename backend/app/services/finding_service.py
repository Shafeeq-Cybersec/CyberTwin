"""Security findings data-access layer + auto-generation engine."""

import uuid
from typing import Literal

from sqlalchemy import case, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.asset import Asset, AssetType, Criticality
from app.models.finding import Finding, FindingType
from app.models.vulnerability import Severity, VulnStatus
from app.schemas.finding import FindingCreate, FindingStats, FindingUpdate
from app.services.finding_catalog import CATALOG

SortOrder = Literal["asc", "desc"]

# Order used to rank severity for sorting/aggregation.
_SEVERITY_RANK = {
    Severity.critical: 5,
    Severity.high: 4,
    Severity.medium: 3,
    Severity.low: 2,
    Severity.info: 1,
}


async def get_finding(db: AsyncSession, finding_id: uuid.UUID) -> Finding | None:
    result = await db.execute(select(Finding).where(Finding.id == finding_id))
    return result.scalar_one_or_none()


async def create_finding(db: AsyncSession, payload: FindingCreate) -> Finding:
    finding = Finding(**payload.model_dump())
    db.add(finding)
    await db.commit()
    await db.refresh(finding)
    return finding


async def update_finding(db: AsyncSession, finding: Finding, payload: FindingUpdate) -> Finding:
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(finding, field, value)
    await db.commit()
    await db.refresh(finding)
    return finding


async def delete_finding(db: AsyncSession, finding: Finding) -> None:
    await db.delete(finding)
    await db.commit()


async def list_findings(
    db: AsyncSession,
    *,
    search: str | None = None,
    finding_type: FindingType | None = None,
    severity: Severity | None = None,
    status: VulnStatus | None = None,
    asset_id: uuid.UUID | None = None,
    sort_order: SortOrder = "desc",
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Finding], int]:
    """Filtered/sorted/paginated findings + total count.

    Sorting is by severity rank (via a CASE) so the most severe surface first.
    """
    stmt = select(Finding)

    if search:
        term = f"%{search.strip()}%"
        stmt = stmt.where(
            or_(
                Finding.title.ilike(term),
                Finding.description.ilike(term),
                Finding.mitre_technique_id.ilike(term),
            )
        )
    if finding_type is not None:
        stmt = stmt.where(Finding.finding_type == finding_type)
    if severity is not None:
        stmt = stmt.where(Finding.severity == severity)
    if status is not None:
        stmt = stmt.where(Finding.status == status)
    if asset_id is not None:
        stmt = stmt.where(Finding.asset_id == asset_id)

    total = await db.scalar(select(func.count()).select_from(stmt.subquery())) or 0

    # Rank severity numerically so we can ORDER BY it directly in SQL
    severity_rank = case(
        {sev.value: rank for sev, rank in _SEVERITY_RANK.items()},
        value=Finding.severity,
        else_=0,
    )
    order_dir = severity_rank.asc() if sort_order == "asc" else severity_rank.desc()
    stmt = stmt.order_by(order_dir, Finding.created_at.desc())

    page = max(page, 1)
    stmt = stmt.limit(page_size).offset((page - 1) * page_size)

    result = await db.execute(stmt)
    return list(result.scalars().all()), total


async def get_stats(db: AsyncSession) -> FindingStats:
    """Aggregate counts by severity, status, and type for the dashboard."""
    result = await db.execute(select(Finding))
    findings = list(result.scalars().all())

    by_severity: dict[str, int] = {}
    by_status: dict[str, int] = {}
    by_type: dict[str, int] = {}
    open_count = 0

    for f in findings:
        by_severity[f.severity.value] = by_severity.get(f.severity.value, 0) + 1
        by_status[f.status.value] = by_status.get(f.status.value, 0) + 1
        by_type[f.finding_type.value] = by_type.get(f.finding_type.value, 0) + 1
        if f.status == VulnStatus.open:
            open_count += 1

    return FindingStats(
        total=len(findings),
        open=open_count,
        by_severity=by_severity,
        by_status=by_status,
        by_type=by_type,
    )


def _detect_types(asset: Asset) -> list[FindingType]:
    """Heuristic rules mapping an asset's risk factors to finding types."""
    types: list[FindingType] = []
    if asset.missing_mfa:
        types.append(FindingType.missing_mfa)
    if asset.weak_password:
        types.append(FindingType.weak_password)
    if asset.cvss_score >= 9.0:
        types.append(FindingType.critical_cve)
    if asset.misconfigured:
        types.append(FindingType.privilege_escalation)
    if asset.internet_exposed:
        if asset.asset_type == AssetType.database:
            types.append(FindingType.exposed_database)
        elif asset.open_ports > 0:
            # Generic remote-access exposure — RDP is the highest-value target
            types.append(FindingType.open_rdp)
    if asset.criticality == Criticality.critical and asset.internet_exposed:
        types.append(FindingType.lateral_movement_risk)
    return types


async def generate_findings(db: AsyncSession) -> int:
    """Scan all assets and create findings from their risk factors.

    Idempotent per (asset, finding_type): if an *open* finding of the same
    type already exists for an asset, it is not duplicated.
    """
    assets = (await db.execute(select(Asset))).scalars().all()

    # Existing open (asset_id, type) pairs to avoid duplicates
    existing_rows = await db.execute(
        select(Finding.asset_id, Finding.finding_type).where(Finding.status == VulnStatus.open)
    )
    existing = {(row[0], row[1]) for row in existing_rows.all()}

    created = 0
    for asset in assets:
        for ftype in _detect_types(asset):
            if (asset.id, ftype) in existing:
                continue
            tpl = CATALOG[ftype]
            db.add(
                Finding(
                    finding_type=ftype,
                    title=tpl.title,
                    severity=tpl.severity,
                    description=tpl.description,
                    recommendation=tpl.recommendation,
                    mitre_tactic=tpl.mitre_tactic,
                    mitre_technique_id=tpl.mitre_technique_id,
                    mitre_technique_name=tpl.mitre_technique_name,
                    status=VulnStatus.open,
                    asset_id=asset.id,
                )
            )
            existing.add((asset.id, ftype))
            created += 1

    if created:
        await db.commit()
    return created
