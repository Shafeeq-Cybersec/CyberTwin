"""Asset inventory CRUD + listing endpoints."""

import uuid
from math import ceil

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.postgres import get_db
from app.models.asset import AssetStatus, AssetType, Criticality
from app.models.user import User
from app.schemas.asset import AssetCreate, AssetPage, AssetRead, AssetUpdate
from app.services import asset_service

router = APIRouter(prefix="/assets", tags=["assets"])


@router.get("", response_model=AssetPage)
async def list_assets(
    search: str | None = Query(None, description="Match name, hostname, IP, or owner"),
    asset_type: AssetType | None = None,
    criticality: Criticality | None = None,
    status: AssetStatus | None = None,
    department: str | None = None,
    sort_by: str = Query("created_at", pattern="^(name|risk|created_at)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> AssetPage:
    """List assets with search, filtering, sorting, and pagination."""
    items, total = await asset_service.list_assets(
        db,
        search=search,
        asset_type=asset_type,
        criticality=criticality,
        status=status,
        department=department,
        sort_by=sort_by,  # validated by the regex above
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )
    return AssetPage(
        items=[asset_service.to_read(a) for a in items],
        total=total,
        page=page,
        page_size=page_size,
        pages=ceil(total / page_size) if total else 0,
    )


@router.post("", response_model=AssetRead, status_code=status.HTTP_201_CREATED)
async def create_asset(
    payload: AssetCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> AssetRead:
    """Create a new asset."""
    asset = await asset_service.create_asset(db, payload)
    return asset_service.to_read(asset)


async def _get_or_404(db: AsyncSession, asset_id: uuid.UUID):
    """Fetch an asset or raise 404."""
    asset = await asset_service.get_asset(db, asset_id)
    if asset is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Asset not found")
    return asset


@router.get("/{asset_id}", response_model=AssetRead)
async def get_asset(
    asset_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> AssetRead:
    """Fetch a single asset's details."""
    asset = await _get_or_404(db, asset_id)
    return asset_service.to_read(asset)


@router.patch("/{asset_id}", response_model=AssetRead)
async def update_asset(
    asset_id: uuid.UUID,
    payload: AssetUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> AssetRead:
    """Partially update an asset."""
    asset = await _get_or_404(db, asset_id)
    updated = await asset_service.update_asset(db, asset, payload)
    return asset_service.to_read(updated)


@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_asset(
    asset_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> None:
    """Delete an asset."""
    asset = await _get_or_404(db, asset_id)
    await asset_service.delete_asset(db, asset)

@router.post("/import/nmap", status_code=status.HTTP_200_OK)
async def import_nmap_scan(
    xml_data: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> dict:
    """Ingest Nmap scanner XML output and populate the asset inventory."""
    from app.services.nmap_importer import parse_nmap_xml
    try:
        discovered = parse_nmap_xml(xml_data)
        return {"imported_count": len(discovered), "assets": discovered}
    except Exception as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=f"Failed to parse Nmap XML: {exc}")
