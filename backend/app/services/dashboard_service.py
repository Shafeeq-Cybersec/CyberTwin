"""SOC dashboard aggregation.

Computes KPI cards and chart series from the asset and vulnerability data.
Risk-based figures reuse the Risk Scoring Engine so the dashboard and the
per-asset views always agree.
"""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.asset import Asset, AssetType, Criticality
from app.models.vulnerability import Severity, Vulnerability
from app.schemas.dashboard import (
    DashboardData,
    DashboardKpis,
    DepartmentRisk,
    LabeledCount,
    TopVulnerability,
)
from app.schemas.risk import RiskLevel
from app.services.risk_service import compute_risk

# Human-readable labels for risk levels on the distribution chart.
RISK_LEVEL_LABELS = {
    RiskLevel.green: "Low",
    RiskLevel.yellow: "Guarded",
    RiskLevel.orange: "Elevated",
    RiskLevel.red: "Critical",
}

# Display labels for asset types (backend-side copy for chart labels).
ASSET_TYPE_LABELS = {
    AssetType.laptop: "Laptop",
    AssetType.desktop: "Desktop",
    AssetType.server: "Server",
    AssetType.router: "Router",
    AssetType.firewall: "Firewall",
    AssetType.switch: "Switch",
    AssetType.database: "Database",
    AssetType.application: "Application",
    AssetType.user: "User",
    AssetType.cloud_instance: "Cloud Instance",
}


async def get_dashboard(db: AsyncSession) -> DashboardData:
    """Build the full dashboard payload in a handful of queries."""
    # Load all assets once — computing risk requires the full row anyway.
    assets = list((await db.execute(select(Asset))).scalars().all())
    risks = {a.id: compute_risk(a) for a in assets}

    # ---- KPI cards ----
    total_assets = len(assets)
    critical_assets = sum(1 for a in assets if a.criticality == Criticality.critical)
    internet_facing = sum(1 for a in assets if a.internet_exposed)
    # High-risk users: user-type assets whose computed risk is orange/red
    high_risk_users = sum(
        1
        for a in assets
        if a.asset_type == AssetType.user and risks[a.id].level in (RiskLevel.orange, RiskLevel.red)
    )
    avg_risk = round(sum(r.score for r in risks.values()) / total_assets) if total_assets else 0

    # Critical CVEs: distinct vulnerabilities at critical severity
    critical_cves = await db.scalar(
        select(func.count()).select_from(Vulnerability).where(Vulnerability.severity == Severity.critical)
    ) or 0

    kpis = DashboardKpis(
        total_assets=total_assets,
        critical_assets=critical_assets,
        internet_facing_assets=internet_facing,
        high_risk_users=high_risk_users,
        critical_cves=int(critical_cves),
        average_risk_score=avg_risk,
    )

    # ---- Risk distribution (by level) ----
    level_counts: dict[RiskLevel, int] = {lvl: 0 for lvl in RiskLevel}
    for r in risks.values():
        level_counts[r.level] += 1
    risk_distribution = [
        LabeledCount(label=RISK_LEVEL_LABELS[lvl], value=level_counts[lvl])
        for lvl in (RiskLevel.green, RiskLevel.yellow, RiskLevel.orange, RiskLevel.red)
    ]

    # ---- Asset types ----
    type_counts: dict[AssetType, int] = {}
    for a in assets:
        type_counts[a.asset_type] = type_counts.get(a.asset_type, 0) + 1
    asset_types = [
        LabeledCount(label=ASSET_TYPE_LABELS.get(t, t.value), value=c)
        for t, c in sorted(type_counts.items(), key=lambda kv: kv[1], reverse=True)
    ]

    # ---- Department risk (average score per department) ----
    dept_scores: dict[str, list[int]] = {}
    for a in assets:
        dept = a.department or "Unassigned"
        dept_scores.setdefault(dept, []).append(risks[a.id].score)
    department_risk = sorted(
        (
            DepartmentRisk(
                department=dept,
                average_risk=round(sum(scores) / len(scores)),
                asset_count=len(scores),
            )
            for dept, scores in dept_scores.items()
        ),
        key=lambda d: d.average_risk,
        reverse=True,
    )

    # ---- Operating systems ----
    os_counts: dict[str, int] = {}
    for a in assets:
        os = a.operating_system or "Unknown"
        os_counts[os] = os_counts.get(os, 0) + 1
    operating_systems = [
        LabeledCount(label=os, value=c)
        for os, c in sorted(os_counts.items(), key=lambda kv: kv[1], reverse=True)
    ]

    # ---- Top vulnerabilities (by CVSS, then affected asset count) ----
    vulns = list((await db.execute(select(Vulnerability))).scalars().all())
    vulns.sort(key=lambda v: (v.cvss, len(v.affected_assets)), reverse=True)
    top_vulnerabilities = [
        TopVulnerability(
            id=str(v.id),
            cve_id=v.cve_id,
            title=v.title,
            severity=v.severity.value,
            cvss=v.cvss,
            affected_assets=len(v.affected_assets),
        )
        for v in vulns[:5]
    ]

    return DashboardData(
        kpis=kpis,
        risk_distribution=risk_distribution,
        asset_types=asset_types,
        department_risk=department_risk[:8],
        operating_systems=operating_systems[:8],
        top_vulnerabilities=top_vulnerabilities,
    )
