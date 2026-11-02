"""Asset inventory data-access layer.

Encapsulates all PostgreSQL queries for assets: CRUD plus the
search/filter/sort/paginate logic behind the list endpoint.
"""

import uuid
from typing import Literal

from sqlalchemy import asc, case, desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.asset import (
    CRITICALITY_WEIGHT,
    Asset,
    AssetStatus,
    AssetType,
    Criticality,
)
from app.schemas.asset import AssetCreate, AssetRead, AssetUpdate
from app.services.risk_service import compute_risk

SortField = Literal["name", "risk", "created_at"]
SortOrder = Literal["asc", "desc"]


def to_read(asset: Asset) -> AssetRead:
    """Serialize an ORM asset into an AssetRead with its computed risk profile."""
    return AssetRead(
        **{c.name: getattr(asset, c.name) for c in Asset.__table__.columns},
        risk=compute_risk(asset),
    )


async def get_asset(db: AsyncSession, asset_id: uuid.UUID) -> Asset | None:
    """Fetch a single asset by id (or None)."""
    return await db.get(Asset, asset_id)


async def create_asset(db: AsyncSession, payload: AssetCreate) -> Asset:
    """Insert a new asset."""
    asset = Asset(**payload.model_dump())
    db.add(asset)
    await db.commit()
    await db.refresh(asset)
    return asset


async def update_asset(db: AsyncSession, asset: Asset, payload: AssetUpdate) -> Asset:
    """Apply a partial update to an existing asset."""
    # exclude_unset → only overwrite fields the client actually sent
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(asset, field, value)
    await db.commit()
    await db.refresh(asset)
    return asset


async def delete_asset(db: AsyncSession, asset: Asset) -> None:
    """Remove an asset."""
    await db.delete(asset)
    await db.commit()


def _risk_ordering():
    """SQL CASE expression mapping criticality → numeric weight so we can
    ORDER BY risk directly in the database."""
    return case(
        {crit.value: weight for crit, weight in CRITICALITY_WEIGHT.items()},
        value=Asset.criticality,
        else_=0,
    )


async def list_assets(
    db: AsyncSession,
    *,
    search: str | None = None,
    asset_type: AssetType | None = None,
    criticality: Criticality | None = None,
    status: AssetStatus | None = None,
    department: str | None = None,
    sort_by: SortField = "created_at",
    sort_order: SortOrder = "desc",
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Asset], int]:
    """Return a filtered/sorted/paginated page of assets and the total count.

    `search` matches name, hostname, IP, or owner (case-insensitive).
    """
    stmt = select(Asset)

    # --- Search across common text fields ---
    if search:
        term = f"%{search.strip()}%"
        stmt = stmt.where(
            or_(
                Asset.name.ilike(term),
                Asset.hostname.ilike(term),
                Asset.ip_address.ilike(term),
                Asset.owner.ilike(term),
            )
        )

    # --- Exact-match filters ---
    if asset_type is not None:
        stmt = stmt.where(Asset.asset_type == asset_type)
    if criticality is not None:
        stmt = stmt.where(Asset.criticality == criticality)
    if status is not None:
        stmt = stmt.where(Asset.status == status)
    if department:
        stmt = stmt.where(Asset.department == department)

    # --- Total count before pagination ---
    total = await db.scalar(select(func.count()).select_from(stmt.subquery())) or 0

    # --- Sorting ---
    direction = desc if sort_order == "desc" else asc
    if sort_by == "name":
        stmt = stmt.order_by(direction(Asset.name))
    elif sort_by == "risk":
        stmt = stmt.order_by(direction(_risk_ordering()), Asset.name.asc())
    else:  # created_at
        stmt = stmt.order_by(direction(Asset.created_at))

    # --- Pagination ---
    page = max(page, 1)
    stmt = stmt.limit(page_size).offset((page - 1) * page_size)

    result = await db.execute(stmt)
    return list(result.scalars().all()), total
