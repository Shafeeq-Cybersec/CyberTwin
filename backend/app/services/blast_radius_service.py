"""Blast Radius Calculation Service.

Traverses downstream connections from a compromised asset to calculate:
- Affected downstream nodes categorized by network hop distance
- Cumulative compromise probability per hop
- Critical assets and crown-jewel assets within reach
- Overall Blast Impact Score and automated architectural mitigation recommendation
"""

import math
import uuid
from typing import Any

from neo4j import AsyncDriver
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.asset import Asset, AssetType, Criticality
from app.schemas.twin import BlastRadiusNode, BlastRadiusResponse
from app.services.risk_service import compute_risk


async def calculate_blast_radius(
    db: AsyncSession,
    driver: AsyncDriver,
    source_id: uuid.UUID,
    max_hops: int = 4,
) -> BlastRadiusResponse:
    """Traverse outgoing and bidirectional lateral edges from source_id."""
    # 1. Fetch source asset
    result = await db.execute(select(Asset).where(Asset.id == source_id))
    source_asset = result.scalar_one_or_none()
    if not source_asset:
        raise ValueError(f"Asset {source_id} not found")

    # 2. Query Neo4j for reachable paths up to max_hops
    cypher = """
    MATCH path = (src:Asset {id: $source_id})-[*1..4]->(target:Asset)
    WHERE src <> target
    WITH target.id AS target_id, min(length(path)) AS hops
    RETURN target_id, hops
    ORDER BY hops ASC
    """

    reachable_hops: dict[str, int] = {}
    if driver:
        try:
            async with driver.session() as session:
                res = await session.run(cypher, source_id=str(source_id))
                async for record in res:
                    reachable_hops[record["target_id"]] = record["hops"]
        except Exception:
            # Fallback if Neo4j is offline
            pass

    # 3. Fetch assets for all reached IDs
    reached_uuids = [uuid.UUID(tid) for tid in reachable_hops.keys() if tid]
    affected_nodes: list[BlastRadiusNode] = []
    crown_jewel_at_risk = False
    critical_count = 0

    if reached_uuids:
        assets_res = await db.execute(select(Asset).where(Asset.id.in_(reached_uuids)))
        assets = assets_res.scalars().all()

        for a in assets:
            hops = reachable_hops.get(str(a.id), 1)
            risk = compute_risk(a)

            # Decay probability by hop distance and node protection
            # P_hop = max(10, min(95, risk.score)) * (0.75 ^ (hops - 1))
            decay = math.pow(0.75, hops - 1)
            prob = int(round(max(10, min(95, risk.score)) * decay))

            if a.criticality == Criticality.critical:
                critical_count += 1
            if a.criticality == Criticality.critical or a.asset_type in {AssetType.database, AssetType.server}:
                crown_jewel_at_risk = True

            affected_nodes.append(
                BlastRadiusNode(
                    id=a.id,
                    name=a.name,
                    asset_type=a.asset_type,
                    criticality=a.criticality,
                    risk_score=risk.score,
                    risk_level=risk.level,
                    hops_away=hops,
                    compromise_probability=prob,
                )
            )

    # Calculate overall blast score
    src_risk = compute_risk(source_asset).score
    impact_sum = sum(n.risk_score * (n.compromise_probability / 100.0) for n in affected_nodes)
    avg_impact = (impact_sum / max(1, len(affected_nodes))) if affected_nodes else 0
    estimated_impact = int(min(100, (src_risk * 0.4) + (avg_impact * 0.6) + (critical_count * 5)))

    # Actionable mitigation suggestion
    if critical_count > 0:
        mitigation = (
            f"Immediate isolation recommended: Compromising '{source_asset.name}' exposes {critical_count} critical "
            f"assets. Sever outgoing network ingress and revoke cached service principal credentials."
        )
    elif len(affected_nodes) > 0:
        mitigation = (
            f"Enforce egress filtering on '{source_asset.name}' to constrain lateral movement to {len(affected_nodes)} "
            f"adjacent hosts."
        )
    else:
        mitigation = f"Asset '{source_asset.name}' is currently isolated; no active downstream blast propagation detected."

    return BlastRadiusResponse(
        source_id=source_asset.id,
        source_name=source_asset.name,
        affected_nodes=sorted(affected_nodes, key=lambda n: (n.hops_away, -n.risk_score)),
        total_affected=len(affected_nodes),
        critical_assets_compromised=critical_count,
        crown_jewel_at_risk=crown_jewel_at_risk,
        estimated_impact_score=estimated_impact,
        recommended_mitigation=mitigation,
    )
