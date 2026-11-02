"""Attack Path Analysis.

Finds directed paths through the twin graph (Neo4j) from likely attacker
entry points to high-value targets, then scores and explains each path using
the assets' risk profiles (PostgreSQL + the Risk Scoring Engine).

Model:
- Entry points: internet-exposed assets, or user/endpoint assets an attacker
  could phish (user, laptop, desktop).
- Targets: critical-criticality assets, or databases (crown-jewel data).
- Per-asset exploit likelihood is derived from its risk score, clamped away
  from 0 and 1 so no single asset is treated as impossible or certain.
- A path's overall probability is the product of the likelihoods of the
  assets an attacker must compromise after the entry point (longer or
  better-secured chains are less probable).
- The "weakest link" is the least-secure asset on the path (highest risk),
  i.e. the path's point of least resistance.
"""

import uuid

from neo4j import AsyncDriver
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.asset import Asset, AssetType, Criticality
from app.schemas.risk import RiskProfile
from app.schemas.twin import (
    AttackPath,
    AttackPathNode,
    AttackStep,
    RelationshipType,
)
from app.services.risk_service import compute_risk

# Asset types that make plausible attacker footholds
_ENTRY_TYPES = {AssetType.user, AssetType.laptop, AssetType.desktop}

# How an attacker is described moving across each relationship type
_STEP_VERB = {
    RelationshipType.USES: "leverages access from",
    RelationshipType.RUNS_ON: "pivots to the host running",
    RelationshipType.CONNECTS_TO: "moves laterally across the connection from",
    RelationshipType.STORES: "reaches the data stored by",
    RelationshipType.PROTECTS: "bypasses the protection between",
    RelationshipType.MEMBER_OF: "escalates via group membership from",
}

# Upper bound on path length and result count to keep queries bounded
MAX_PATH_LENGTH = 6
MAX_RESULTS = 12


def _likelihood(score: int) -> float:
    """Map a 0–100 risk score to a per-asset exploit likelihood in [0.05, 0.95]."""
    return max(0.05, min(score / 100, 0.95))


def _weakness_reason(asset: Asset, risk: RiskProfile) -> str:
    """Explain, in one clause, why the target asset is exploitable."""
    if asset.internet_exposed:
        return "it is exposed to the internet"
    if asset.missing_mfa:
        return "it lacks multi-factor authentication"
    if asset.weak_password:
        return "it uses weak credentials"
    if asset.cvss_score >= 7:
        return f"it carries a high-severity vulnerability (CVSS {asset.cvss_score:.1f})"
    if asset.misconfigured:
        return "it is misconfigured"
    if risk.factors:
        return f"its risk is driven by {risk.factors[0].name.lower()}"
    return "it presents residual exposure"


async def _find_raw_paths(
    driver: AsyncDriver, sources: list[str], targets: list[str], max_length: int
) -> list[tuple[list[str], list[str]]]:
    """Return raw (node_ids, relationship_types) tuples for each directed path."""
    # max_length is validated to an int below, so inlining it into the pattern
    # (which Cypher cannot parameterise) is safe.
    query = (
        f"MATCH p = (s:Asset)-[rels*1..{max_length}]->(t:Asset) "
        "WHERE s.id IN $sources AND t.id IN $targets AND s <> t "
        "RETURN [n IN nodes(p) | n.id] AS node_ids, "
        "       [r IN relationships(p) | type(r)] AS rel_types "
        f"LIMIT {MAX_RESULTS * 4}"
    )
    out: list[tuple[list[str], list[str]]] = []
    async with driver.session() as session:
        result = await session.run(query, sources=sources, targets=targets)
        async for record in result:
            out.append((record["node_ids"], record["rel_types"]))
    return out


async def analyze_attack_paths(
    db: AsyncSession,
    driver: AsyncDriver,
    *,
    target_id: uuid.UUID | None = None,
    max_length: int = MAX_PATH_LENGTH,
) -> list[AttackPath]:
    """Compute the top scored/explained attack paths in the environment.

    If `target_id` is given, only paths ending at that asset are returned.
    """
    max_length = max(1, min(max_length, MAX_PATH_LENGTH))

    # Load assets + precompute risk once
    assets = {a.id: a for a in (await db.execute(select(Asset))).scalars().all()}
    if not assets:
        return []
    risks = {aid: compute_risk(a) for aid, a in assets.items()}

    # Entry points and targets
    sources = [
        str(aid)
        for aid, a in assets.items()
        if a.internet_exposed or a.asset_type in _ENTRY_TYPES
    ]
    if target_id is not None:
        targets = [str(target_id)] if target_id in assets else []
    else:
        targets = [
            str(aid)
            for aid, a in assets.items()
            if a.criticality == Criticality.critical or a.asset_type == AssetType.database
        ]
    if not sources or not targets:
        return []

    raw = await _find_raw_paths(driver, sources, targets, max_length)

    paths: list[AttackPath] = []
    for node_ids_str, rel_types in raw:
        # Convert to UUIDs and skip paths referencing unknown/stale assets
        try:
            node_ids = [uuid.UUID(n) for n in node_ids_str]
        except ValueError:
            continue
        if any(nid not in assets for nid in node_ids) or len(node_ids) < 2:
            continue

        # Build nodes
        nodes = [
            AttackPathNode(
                id=nid,
                name=assets[nid].name,
                asset_type=assets[nid].asset_type,
                risk_score=risks[nid].score,
                risk_level=risks[nid].level,
            )
            for nid in node_ids
        ]

        # Build steps + overall probability (product of post-entry likelihoods)
        steps: list[AttackStep] = []
        probability = 1.0
        for i, rel in enumerate(rel_types):
            try:
                rel_type = RelationshipType(rel)
            except ValueError:
                rel_type = RelationshipType.CONNECTS_TO  # unknown → generic hop
            frm, to = node_ids[i], node_ids[i + 1]
            to_asset, to_risk = assets[to], risks[to]
            step_p = _likelihood(to_risk.score)
            probability *= step_p
            verb = _STEP_VERB.get(rel_type, "moves to")
            steps.append(
                AttackStep(
                    from_id=frm,
                    from_name=assets[frm].name,
                    to_id=to,
                    to_name=to_asset.name,
                    relationship=rel_type,
                    explanation=(
                        f"Attacker {verb} {assets[frm].name} to {to_asset.name} "
                        f"because {_weakness_reason(to_asset, to_risk)}."
                    ),
                    step_probability=round(step_p * 100),
                )
            )

        # Weakest link = least-secure (highest-risk) asset on the path
        weakest = max(node_ids, key=lambda nid: risks[nid].score)

        paths.append(
            AttackPath(
                id="->".join(node_ids_str),
                nodes=nodes,
                steps=steps,
                probability=round(probability * 100),
                length=len(rel_types),
                entry_name=nodes[0].name,
                target_name=nodes[-1].name,
                weakest_link_id=weakest,
                weakest_link_name=assets[weakest].name,
                weakest_link_score=risks[weakest].score,
            )
        )

    # Highest-probability paths first; break ties by shorter chains
    paths.sort(key=lambda p: (p.probability, -p.length), reverse=True)
    return paths[:MAX_RESULTS]
