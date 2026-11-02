"""Pydantic schemas for the security findings API."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.finding import FindingType
from app.models.vulnerability import Severity, VulnStatus
from app.schemas.vulnerability import AssetSummary


class FindingBase(BaseModel):
    finding_type: FindingType
    title: str = Field(..., min_length=1, max_length=255)
    severity: Severity = Severity.medium
    description: str | None = None
    recommendation: str | None = None
    mitre_tactic: str | None = Field(None, max_length=100)
    mitre_technique_id: str | None = Field(None, max_length=20)
    mitre_technique_name: str | None = Field(None, max_length=150)
    status: VulnStatus = VulnStatus.open


class FindingCreate(FindingBase):
    asset_id: uuid.UUID


class FindingUpdate(BaseModel):
    """Partial update — every field optional."""

    finding_type: FindingType | None = None
    title: str | None = Field(None, min_length=1, max_length=255)
    severity: Severity | None = None
    description: str | None = None
    recommendation: str | None = None
    mitre_tactic: str | None = Field(None, max_length=100)
    mitre_technique_id: str | None = Field(None, max_length=20)
    mitre_technique_name: str | None = Field(None, max_length=150)
    status: VulnStatus | None = None
    asset_id: uuid.UUID | None = None


class FindingRead(FindingBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    asset_id: uuid.UUID
    asset: AssetSummary
    created_at: datetime
    updated_at: datetime


class FindingPage(BaseModel):
    items: list[FindingRead]
    total: int
    page: int
    page_size: int
    pages: int


class FindingStats(BaseModel):
    """Aggregate counts powering the findings dashboard."""

    total: int
    open: int
    by_severity: dict[str, int]
    by_status: dict[str, int]
    by_type: dict[str, int]


class GenerateResult(BaseModel):
    """Outcome of an auto-generation run."""

    created: int
    message: str
