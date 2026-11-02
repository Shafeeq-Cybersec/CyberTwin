"""Schemas for the Threat Intelligence module."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.threat_intel import ThreatSource
from app.models.vulnerability import Severity


class ThreatIntelRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    source: ThreatSource
    external_id: str
    title: str
    description: str | None
    severity: Severity | None
    cvss: float | None
    kev: bool
    mitre_technique_id: str | None
    mitre_tactic: str | None
    capec_id: str | None
    references: list[str]
    published: str | None
    created_at: datetime


class ImportResult(BaseModel):
    """Per-source counts from an import run."""

    imported: dict[str, int]   # source → number of entries upserted
    total: int
    message: str


class CorrelationResult(BaseModel):
    """Outcome of correlating threats to assets."""

    threats_matched: int
    assets_updated: int
    findings_created: int
    message: str


class ThreatStats(BaseModel):
    total: int
    by_source: dict[str, int]
    kev_count: int


class AssetThreatMatch(BaseModel):
    """A threat correlated to a specific asset (via a matching CVE)."""

    threat: ThreatIntelRead
    via_cve: str
