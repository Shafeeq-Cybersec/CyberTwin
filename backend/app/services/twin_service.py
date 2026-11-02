"""Digital Twin graph service.

Assets are the source of truth in PostgreSQL. Neo4j stores only the
*relationships* between them (keyed by asset UUID). This service keeps a
lightweight `:Asset {id}` node in Neo4j per relationship endpoint and
exposes read/write helpers for the twin graph.

The graph endpoint composes both stores: node metadata (name, type,
criticality, …) comes from PostgreSQL; edges come from Neo4j.
"""

import uuid

from neo4j import AsyncDriver
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.asset import Asset
from app.schemas.twin import (
    Graph,
    GraphEdge,
    GraphNode,
    RelationshipType,
)
from app.services.risk_service import compute_risk

# Relationship type is validated by the RelationshipType enum before it ever
# reaches Cypher, so interpolating it into the query string is safe (Cypher
# cannot parameterise relationship types).


async def ensure_asset_node(driver: AsyncDriver, asset_id: uuid.UUID) -> None:
    """Create the :Asset node for an asset id if it doesn't exist yet."""
    async with driver.session() as session:
        await session.run("MERGE (:Asset {id: $id})", id=str(asset_id))


async def create_relationship(
    driver: AsyncDriver, source: uuid.UUID, target: uuid.UUID, rel_type: RelationshipType
) -> str:
    """Create a directed relationship and return its Neo4j element id."""
    query = (
        "MERGE (a:Asset {id: $source}) "
        "MERGE (b:Asset {id: $target}) "
        f"MERGE (a)-[r:{rel_type.value}]->(b) "
        "RETURN elementId(r) AS id"
    )
    async with driver.session() as session:
        result = await session.run(query, source=str(source), target=str(target))
        record = await result.single()
        return record["id"]


async def delete_relationship(driver: AsyncDriver, element_id: str) -> bool:
    """Delete a relationship by its element id. Returns True if one was removed."""
    query = (
        "MATCH ()-[r]->() WHERE elementId(r) = $eid "
        "WITH r, count(r) AS c DELETE r RETURN c AS deleted"
    )
    async with driver.session() as session:
        result = await session.run(query, eid=element_id)
        record = await result.single()
        return bool(record and record["deleted"])


async def get_edges(driver: AsyncDriver) -> list[GraphEdge]:
    """Read every relationship in the twin graph."""
    query = (
        "MATCH (a:Asset)-[r]->(b:Asset) "
        "RETURN elementId(r) AS id, a.id AS source, b.id AS target, type(r) AS type"
    )
    edges: list[GraphEdge] = []
    async with driver.session() as session:
        result = await session.run(query)
        async for record in result:
            # Skip any relationship whose type isn't one we support
            if record["type"] not in RelationshipType.__members__:
                continue
            edges.append(
                GraphEdge(
                    id=record["id"],
                    source=uuid.UUID(record["source"]),
                    target=uuid.UUID(record["target"]),
                    type=RelationshipType(record["type"]),
                )
            )
    return edges


async def get_relationship(driver: AsyncDriver, element_id: str) -> GraphEdge | None:
    """Fetch a single relationship by its element id."""
    query = (
        "MATCH (a:Asset)-[r]->(b:Asset) WHERE elementId(r) = $eid "
        "RETURN elementId(r) AS id, a.id AS source, b.id AS target, type(r) AS type"
    )
    async with driver.session() as session:
        result = await session.run(query, eid=element_id)
        record = await result.single()
    if record is None or record["type"] not in RelationshipType.__members__:
        return None
    return GraphEdge(
        id=record["id"],
        source=uuid.UUID(record["source"]),
        target=uuid.UUID(record["target"]),
        type=RelationshipType(record["type"]),
    )


async def update_relationship(
    driver: AsyncDriver,
    element_id: str,
    source: uuid.UUID,
    target: uuid.UUID,
    rel_type: RelationshipType,
) -> str:
    """Update a relationship. Neo4j can't rename a relationship type or move
    its endpoints in place, so we delete the old edge and create the new one
    atomically within a single transaction, returning the new element id."""
    async with driver.session() as session:

        async def _tx(tx):
            await tx.run("MATCH ()-[r]->() WHERE elementId(r) = $eid DELETE r", eid=element_id)
            create = (
                "MERGE (a:Asset {id: $source}) "
                "MERGE (b:Asset {id: $target}) "
                f"MERGE (a)-[r:{rel_type.value}]->(b) "
                "RETURN elementId(r) AS id"
            )
            result = await tx.run(create, source=str(source), target=str(target))
            record = await result.single()
            return record["id"]

        return await session.execute_write(_tx)


async def get_graph(db: AsyncSession, driver: AsyncDriver) -> Graph:
    """Compose the full twin graph: asset nodes (Postgres) + edges (Neo4j)."""
    # Nodes: every asset becomes a graph node, carrying its computed risk
    result = await db.execute(select(Asset))
    nodes = []
    for a in result.scalars().all():
        risk = compute_risk(a)
        nodes.append(
            GraphNode(
                id=a.id,
                name=a.name,
                asset_type=a.asset_type,
                criticality=a.criticality,
                status=a.status,
                hostname=a.hostname,
                ip_address=a.ip_address,
                risk_score=risk.score,
                risk_level=risk.level,
            )
        )

    # Edges: only keep those whose endpoints still exist as assets
    known_ids = {n.id for n in nodes}
    edges = [e for e in await get_edges(driver) if e.source in known_ids and e.target in known_ids]

    return Graph(nodes=nodes, edges=edges)
