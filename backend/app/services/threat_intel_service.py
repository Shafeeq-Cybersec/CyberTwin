"""Threat Intelligence service: import, correlate, and feed the Risk Engine.

Pipeline:
  import    → pull feed entries and upsert into `threat_intel`
  correlate → match CVE/KEV threats to assets (via their vulnerabilities),
              raise those assets' CVSS (which the Risk Engine reads), and
              auto-create Critical-CVE findings for the affected assets.

Because the Risk Scoring Engine derives an asset's risk from its
`cvss_score`, raising that field during correlation is what makes risk
scores update automatically after a threat import.
"""

import uuid

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.asset import Asset
from app.models.finding import Finding, FindingType
from app.models.threat_intel import ThreatIntel, ThreatSource
from app.models.vulnerability import Severity, Vulnerability, VulnStatus
from app.schemas.threat_intel import (
    AssetThreatMatch,
    CorrelationResult,
    ImportResult,
    ThreatIntelRead,
    ThreatStats,
)
from app.services.finding_catalog import CATALOG
from app.services.threat_seed import FEEDS

# CVSS floor applied to assets affected by a KEV (known-exploited) threat.
KEV_CVSS_FLOOR = 9.0


async def fetch_source(source: ThreatSource) -> list[dict]:
    """Return raw entries for a source.

    This is the seam where a live HTTP fetch (NVD / CISA KEV / STIX) would
    replace the curated snapshot. Kept async so a real client drops in cleanly.
    """
    return FEEDS.get(source, [])


async def import_feeds(db: AsyncSession, sources: list[ThreatSource]) -> ImportResult:
    """Import (upsert) entries for the requested sources."""
    imported: dict[str, int] = {}

    for source in sources:
        entries = await fetch_source(source)
        count = 0
        for entry in entries:
            existing = await db.scalar(
                select(ThreatIntel).where(
                    ThreatIntel.source == source,
                    ThreatIntel.external_id == entry["external_id"],
                )
            )
            fields = dict(
                title=entry["title"],
                description=entry.get("description"),
                severity=entry.get("severity"),
                cvss=entry.get("cvss"),
                kev=entry.get("kev", False),
                mitre_technique_id=entry.get("mitre_technique_id"),
                mitre_tactic=entry.get("mitre_tactic"),
                capec_id=entry.get("capec_id"),
                references=entry.get("references", []),
                published=entry.get("published"),
            )
            if existing:
                for k, v in fields.items():
                    setattr(existing, k, v)
            else:
                db.add(ThreatIntel(source=source, external_id=entry["external_id"], **fields))
            count += 1
        imported[source.value] = count

    await db.commit()
    total = sum(imported.values())
    return ImportResult(
        imported=imported,
        total=total,
        message=f"Imported {total} threat entries from {len(sources)} source(s).",
    )


async def list_threats(
    db: AsyncSession,
    *,
    source: ThreatSource | None = None,
    kev_only: bool = False,
    search: str | None = None,
) -> list[ThreatIntel]:
    """List imported threat entries with optional filters."""
    stmt = select(ThreatIntel)
    if source is not None:
        stmt = stmt.where(ThreatIntel.source == source)
    if kev_only:
        stmt = stmt.where(ThreatIntel.kev.is_(True))
    if search:
        term = f"%{search.strip()}%"
        stmt = stmt.where(or_(ThreatIntel.external_id.ilike(term), ThreatIntel.title.ilike(term)))
    stmt = stmt.order_by(ThreatIntel.cvss.desc().nullslast(), ThreatIntel.external_id)
    return list((await db.execute(stmt)).scalars().all())


async def get_stats(db: AsyncSession) -> ThreatStats:
    """Aggregate counts by source + KEV total."""
    rows = list((await db.execute(select(ThreatIntel))).scalars().all())
    by_source: dict[str, int] = {}
    kev = 0
    for t in rows:
        by_source[t.source.value] = by_source.get(t.source.value, 0) + 1
        if t.kev:
            kev += 1
    return ThreatStats(total=len(rows), by_source=by_source, kev_count=kev)


async def correlate(db: AsyncSession) -> CorrelationResult:
    """Map CVE/KEV threats to assets, update CVSS, and auto-create findings.

    An asset is affected by a threat when it has a Vulnerability whose
    `cve_id` matches the threat's `external_id`.
    """
    # CVE-like threats keyed by CVE id (KEV entries win over plain CVE ones)
    threats = list(
        (
            await db.execute(
                select(ThreatIntel).where(
                    ThreatIntel.source.in_([ThreatSource.cve, ThreatSource.cisa_kev])
                )
            )
        ).scalars().all()
    )
    by_cve: dict[str, ThreatIntel] = {}
    for t in threats:
        prev = by_cve.get(t.external_id)
        if prev is None or (t.kev and not prev.kev):
            by_cve[t.external_id] = t
    if not by_cve:
        return CorrelationResult(
            threats_matched=0,
            assets_updated=0,
            findings_created=0,
            message="No CVE/KEV threats imported yet — run an import first.",
        )

    # Vulnerabilities matching any imported CVE (assets eager-loaded)
    vulns = list(
        (
            await db.execute(select(Vulnerability).where(Vulnerability.cve_id.in_(list(by_cve))))
        ).scalars().unique().all()
    )

    # Existing open Critical-CVE findings, to avoid duplicates
    existing = {
        row[0]
        for row in (
            await db.execute(
                select(Finding.asset_id).where(
                    Finding.finding_type == FindingType.critical_cve,
                    Finding.status == VulnStatus.open,
                )
            )
        ).all()
    }

    updated_assets: set[uuid.UUID] = set()
    findings_created = 0
    tpl = CATALOG[FindingType.critical_cve]

    for vuln in vulns:
        threat = by_cve[vuln.cve_id]
        threat_cvss = threat.cvss or vuln.cvss or 0.0
        floor = max(threat_cvss, KEV_CVSS_FLOOR if threat.kev else 0.0)

        for asset in vuln.affected_assets:
            # 1. Raise CVSS so the Risk Engine recomputes a higher score
            if floor > asset.cvss_score:
                asset.cvss_score = floor
                updated_assets.add(asset.id)

            # 2. Auto-create a Critical-CVE finding (idempotent per open asset)
            if asset.id not in existing:
                db.add(
                    Finding(
                        finding_type=FindingType.critical_cve,
                        title=f"{threat.external_id} — {threat.title}",
                        severity=Severity.critical if threat.kev else (threat.severity or Severity.high),
                        description=(
                            f"{threat.description or ''} "
                            f"{'Actively exploited (CISA KEV). ' if threat.kev else ''}"
                            f"Correlated to this asset via {vuln.cve_id}."
                        ).strip(),
                        recommendation=tpl.recommendation,
                        mitre_tactic=threat.mitre_tactic or tpl.mitre_tactic,
                        mitre_technique_id=threat.mitre_technique_id or tpl.mitre_technique_id,
                        mitre_technique_name=tpl.mitre_technique_name,
                        status=VulnStatus.open,
                        asset_id=asset.id,
                    )
                )
                existing.add(asset.id)
                findings_created += 1

    await db.commit()
    return CorrelationResult(
        threats_matched=len({v.cve_id for v in vulns}),
        assets_updated=len(updated_assets),
        findings_created=findings_created,
        message=(
            f"Matched {len({v.cve_id for v in vulns})} threat(s) to "
            f"{len(updated_assets)} asset(s); created {findings_created} finding(s) "
            f"and updated risk scores."
        ),
    )


async def matches_for_asset(db: AsyncSession, asset_id: uuid.UUID) -> list[AssetThreatMatch]:
    """Return threats correlated to an asset via its vulnerabilities' CVEs."""
    # CVE ids from the asset's vulnerabilities
    vulns = list(
        (
            await db.execute(
                select(Vulnerability).where(Vulnerability.affected_assets.any(Asset.id == asset_id))
            )
        ).scalars().unique().all()
    )
    cve_ids = {v.cve_id for v in vulns}
    if not cve_ids:
        return []

    threats = list(
        (await db.execute(select(ThreatIntel).where(ThreatIntel.external_id.in_(list(cve_ids))))).scalars().all()
    )
    return [
        AssetThreatMatch(threat=ThreatIntelRead.model_validate(t), via_cve=t.external_id)
        for t in threats
    ]
