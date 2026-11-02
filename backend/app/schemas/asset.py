"""Pydantic schemas for the asset inventory API."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.asset import AssetStatus, AssetType, Criticality
from app.schemas.risk import RiskProfile


class AssetBase(BaseModel):
    """Fields shared by create/update payloads."""

    name: str = Field(..., min_length=1, max_length=255)
    hostname: str | None = Field(None, max_length=255)
    ip_address: str | None = Field(None, max_length=45)
    asset_type: AssetType
    operating_system: str | None = Field(None, max_length=255)
    owner: str | None = Field(None, max_length=255)
    department: str | None = Field(None, max_length=255)
    criticality: Criticality = Criticality.medium
    status: AssetStatus = AssetStatus.active
    tags: list[str] = Field(default_factory=list)
    description: str | None = None

    # --- Risk factors ---
    cvss_score: float = Field(0.0, ge=0.0, le=10.0)
    internet_exposed: bool = False
    missing_mfa: bool = False
    weak_password: bool = False
    misconfigured: bool = False
    open_ports: int = Field(0, ge=0)
    business_importance: int = Field(3, ge=1, le=5)

    @field_validator("tags")
    @classmethod
    def clean_tags(cls, tags: list[str]) -> list[str]:
        """Trim, drop blanks, and de-duplicate tags while preserving order."""
        seen: dict[str, None] = {}
        for tag in tags:
            t = tag.strip()
            if t:
                seen.setdefault(t, None)
        return list(seen.keys())


class AssetCreate(AssetBase):
    """Payload for creating an asset."""


class AssetUpdate(BaseModel):
    """Partial update — every field optional."""

    name: str | None = Field(None, min_length=1, max_length=255)
    hostname: str | None = Field(None, max_length=255)
    ip_address: str | None = Field(None, max_length=45)
    asset_type: AssetType | None = None
    operating_system: str | None = Field(None, max_length=255)
    owner: str | None = Field(None, max_length=255)
    department: str | None = Field(None, max_length=255)
    criticality: Criticality | None = None
    status: AssetStatus | None = None
    tags: list[str] | None = None
    description: str | None = None
    # Risk factors (all optional for partial updates)
    cvss_score: float | None = Field(None, ge=0.0, le=10.0)
    internet_exposed: bool | None = None
    missing_mfa: bool | None = None
    weak_password: bool | None = None
    misconfigured: bool | None = None
    open_ports: int | None = Field(None, ge=0)
    business_importance: int | None = Field(None, ge=1, le=5)


class AssetRead(AssetBase):
    """Full asset representation returned by the API, including the computed
    risk profile."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    risk: RiskProfile


class AssetPage(BaseModel):
    """Paginated list response."""

    items: list[AssetRead]
    total: int
    page: int
    page_size: int
    pages: int
