"""SOC dashboard aggregate endpoint."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.postgres import get_db
from app.models.user import User
from app.schemas.dashboard import DashboardData
from app.services import dashboard_service

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardData)
async def get_dashboard(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> DashboardData:
    """Return all KPI cards and chart series for the SOC dashboard."""
    return await dashboard_service.get_dashboard(db)
