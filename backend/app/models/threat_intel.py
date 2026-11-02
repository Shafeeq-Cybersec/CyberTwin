"""Threat Intelligence ORM model (PostgreSQL).

Stores normalized entries imported from external threat sources
(MITRE ATT&CK, CVE/NVD, CISA KEV, CAPEC). A single table holds all
sources, discriminated by `source` and keyed by `external_id`.
"""

import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, Float, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column

from app.db.postgres import Base
from app.models.vulnerability import Severity


class ThreatSource(str, enum.Enum):
    mitre_attack = "mitre_attack"
    cve = "cve"
    cisa_kev = "cisa_kev"
    capec = "capec"


class ThreatIntel(Base):
    __tablename__ = "threat_intel"
    # One row per (source, external id) — re-imports upsert rather than duplicate
    __table_args__ = (UniqueConstraint("source", "external_id", name="uq_threat_source_extid"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    source: Mapped[ThreatSource] = mapped_column(
        Enum(ThreatSource, name="threat_source"), nullable=False, index=True
    )
    external_id: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)

    severity: Mapped[Severity | None] = mapped_column(Enum(Severity, name="threat_severity"))
    cvss: Mapped[float | None] = mapped_column(Float)
    kev: Mapped[bool] = mapped_column(Boolean, default=False)  # in CISA KEV catalog

    mitre_technique_id: Mapped[str | None] = mapped_column(String(20))
    mitre_tactic: Mapped[str | None] = mapped_column(String(100))
    capec_id: Mapped[str | None] = mapped_column(String(20))

    references: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)
    published: Mapped[str | None] = mapped_column(String(30))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
