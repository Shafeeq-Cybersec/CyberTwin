"""Digital Twin graph + Relationship Engine endpoints (Neo4j-backed)."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from neo4j import AsyncDriver
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.neo4j import get_neo4j
from app.db.postgres import get_db
from app.models.asset import Asset
from app.models.user import User
from app.schemas.twin import (
    AttackPathResponse,
    Graph,
    RelationshipCreate,
    RelationshipType,
    RelationshipUpdate,
    RelationshipView,
)
from app.services import asset_service, attack_path_service, twin_service
from app.services.relationship_rules import validate_relationship

router = APIRouter(prefix="/twin", tags=["twin"])


async def _require_asset(db: AsyncSession, asset_id: uuid.UUID) -> Asset:
    """Load an asset or raise 404."""
    asset = await asset_service.get_asset(db, asset_id)
    if asset is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=f"Asset {asset_id} not found")
    return asset


async def _validated_endpoints(
    db: AsyncSession, source: uuid.UUID, target: uuid.UUID, rel_type: RelationshipType
) -> tuple[Asset, Asset]:
    """Shared checks for create/update: distinct, existing, and type-compatible."""
    if source == target:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="An asset cannot relate to itself")

    src = await _require_asset(db, source)
    tgt = await _require_asset(db, target)

    # Semantic validation against the relationship rule matrix
    error = validate_relationship(rel_type, src.asset_type, tgt.asset_type)
    if error:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, detail=error)

    return src, tgt


@router.get("/graph", response_model=Graph)
async def get_graph(
    db: AsyncSession = Depends(get_db),
    driver: AsyncDriver = Depends(get_neo4j),
    _: User = Depends(get_current_user),
) -> Graph:
    """Return the full digital twin graph: asset nodes + relationships."""
    return await twin_service.get_graph(db, driver)


@router.get("/attack-paths", response_model=AttackPathResponse)
async def get_attack_paths(
    target_id: uuid.UUID | None = None,
    max_length: int = 6,
    db: AsyncSession = Depends(get_db),
    driver: AsyncDriver = Depends(get_neo4j),
    _: User = Depends(get_current_user),
) -> AttackPathResponse:
    """Analyze attack paths from likely entry points to high-value targets.

    Optionally scope to paths ending at a specific `target_id`.
    """
    paths = await attack_path_service.analyze_attack_paths(
        db, driver, target_id=target_id, max_length=max_length
    )
    return AttackPathResponse(paths=paths)


@router.get("/relationship-rules")
async def get_relationship_rules(_: User = Depends(get_current_user)) -> dict:
    """Expose the validation matrix so the UI can offer valid choices."""
    from app.services.relationship_rules import RELATIONSHIP_RULES

    return {
        rel.value: {
            "sources": sorted(t.value for t in sources),
            "targets": sorted(t.value for t in targets),
        }
        for rel, (sources, targets) in RELATIONSHIP_RULES.items()
    }


@router.get("/relationships", response_model=list[RelationshipView])
async def list_relationships(
    db: AsyncSession = Depends(get_db),
    driver: AsyncDriver = Depends(get_neo4j),
    _: User = Depends(get_current_user),
) -> list[RelationshipView]:
    """List all relationships enriched with asset names (for the viewer)."""
    edges = await twin_service.get_edges(driver)

    # Build an id → asset lookup so we can attach names/types in one pass
    result = await db.execute(select(Asset))
    assets = {a.id: a for a in result.scalars().all()}

    views: list[RelationshipView] = []
    for e in edges:
        src, tgt = assets.get(e.source), assets.get(e.target)
        if src is None or tgt is None:
            continue  # dangling edge — endpoint asset was deleted
        views.append(
            RelationshipView(
                id=e.id,
                source=e.source,
                source_name=src.name,
                source_type=src.asset_type,
                target=e.target,
                target_name=tgt.name,
                target_type=tgt.asset_type,
                type=e.type,
            )
        )
    return views


@router.post("/relationships", response_model=RelationshipView, status_code=status.HTTP_201_CREATED)
async def create_relationship(
    payload: RelationshipCreate,
    db: AsyncSession = Depends(get_db),
    driver: AsyncDriver = Depends(get_neo4j),
    _: User = Depends(get_current_user),
) -> RelationshipView:
    """Create a validated relationship between two existing assets."""
    src, tgt = await _validated_endpoints(db, payload.source, payload.target, payload.type)
    edge_id = await twin_service.create_relationship(driver, payload.source, payload.target, payload.type)
    return RelationshipView(
        id=edge_id,
        source=src.id, source_name=src.name, source_type=src.asset_type,
        target=tgt.id, target_name=tgt.name, target_type=tgt.asset_type,
        type=payload.type,
    )


@router.patch("/relationships/{element_id:path}", response_model=RelationshipView)
async def update_relationship(
    element_id: str,
    payload: RelationshipUpdate,
    db: AsyncSession = Depends(get_db),
    driver: AsyncDriver = Depends(get_neo4j),
    _: User = Depends(get_current_user),
) -> RelationshipView:
    """Update a relationship's type and/or endpoints."""
    # The edge must exist first
    if await twin_service.get_relationship(driver, element_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Relationship not found")

    src, tgt = await _validated_endpoints(db, payload.source, payload.target, payload.type)
    new_id = await twin_service.update_relationship(
        driver, element_id, payload.source, payload.target, payload.type
    )
    return RelationshipView(
        id=new_id,
        source=src.id, source_name=src.name, source_type=src.asset_type,
        target=tgt.id, target_name=tgt.name, target_type=tgt.asset_type,
        type=payload.type,
    )


@router.delete("/relationships/{element_id:path}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_relationship(
    element_id: str,
    driver: AsyncDriver = Depends(get_neo4j),
    _: User = Depends(get_current_user),
) -> None:
    """Delete a relationship by its Neo4j element id."""
    removed = await twin_service.delete_relationship(driver, element_id)
    if not removed:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Relationship not found")


@router.post("/nodes/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
async def ensure_node(
    asset_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    driver: AsyncDriver = Depends(get_neo4j),
    _: User = Depends(get_current_user),
) -> None:
    """Register an asset as a standalone node in the twin (no edges yet)."""
    await _require_asset(db, asset_id)
    await twin_service.ensure_asset_node(driver, asset_id)
