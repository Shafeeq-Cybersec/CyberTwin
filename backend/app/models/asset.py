"""Asset ORM model (PostgreSQL) for the inventory module."""

import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, Float, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column

from app.db.postgres import Base


class AssetType(str, enum.Enum):
    laptop = "laptop"
    desktop = "desktop"
    server = "server"
    router = "router"
    firewall = "firewall"
    switch = "switch"
    database = "database"
    application = "application"
    user = "user"
    cloud_instance = "cloud_instance"


class Criticality(str, enum.Enum):
    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"


class AssetStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"
    decommissioned = "decommissioned"
    maintenance = "maintenance"


# Numeric weight per criticality — drives the "sort by risk" ordering
CRITICALITY_WEIGHT = {
    Criticality.critical: 4,
    Criticality.high: 3,
    Criticality.medium: 2,
    Criticality.low: 1,
}


class Asset(Base):
    __tablename__ = "assets"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    hostname: Mapped[str | None] = mapped_column(String(255), index=True)
    ip_address: Mapped[str | None] = mapped_column(String(45))  # fits IPv6
    asset_type: Mapped[AssetType] = mapped_column(Enum(AssetType, name="asset_type"), nullable=False)
    operating_system: Mapped[str | None] = mapped_column(String(255))
    owner: Mapped[str | None] = mapped_column(String(255))
    department: Mapped[str | None] = mapped_column(String(255), index=True)
    criticality: Mapped[Criticality] = mapped_column(
        Enum(Criticality, name="criticality"), default=Criticality.medium, nullable=False
    )
    status: Mapped[AssetStatus] = mapped_column(
        Enum(AssetStatus, name="asset_status"), default=AssetStatus.active, nullable=False
    )
    tags: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)
    description: Mapped[str | None] = mapped_column(Text)

    # --- Risk factors (drive the Risk Scoring Engine) ---
    cvss_score: Mapped[float] = mapped_column(Float, default=0.0)  # 0.0–10.0
    internet_exposed: Mapped[bool] = mapped_column(Boolean, default=False)
    missing_mfa: Mapped[bool] = mapped_column(Boolean, default=False)
    weak_password: Mapped[bool] = mapped_column(Boolean, default=False)
    misconfigured: Mapped[bool] = mapped_column(Boolean, default=False)
    open_ports: Mapped[int] = mapped_column(Integer, default=0)
    business_importance: Mapped[int] = mapped_column(Integer, default=3)  # 1–5

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
