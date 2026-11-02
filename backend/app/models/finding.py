"""Security Finding ORM model (PostgreSQL).

A finding is a typed security issue detected on a single asset (as opposed
to a Vulnerability/CVE, which can affect many assets). Each finding carries a
MITRE ATT&CK mapping for threat context.
"""

import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.postgres import Base
from app.models.asset import Asset
from app.models.vulnerability import Severity, VulnStatus  # reuse shared enums


class FindingType(str, enum.Enum):
    weak_password = "weak_password"
    missing_mfa = "missing_mfa"
    open_rdp = "open_rdp"
    open_ssh = "open_ssh"
    critical_cve = "critical_cve"
    exposed_database = "exposed_database"
    privilege_escalation = "privilege_escalation"
    lateral_movement_risk = "lateral_movement_risk"


class Finding(Base):
    __tablename__ = "findings"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    finding_type: Mapped[FindingType] = mapped_column(
        Enum(FindingType, name="finding_type"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    # Distinct DB enum-type names (finding_*) so create_all doesn't collide
    # with the vulnerability table's identically-named enum types.
    severity: Mapped[Severity] = mapped_column(
        Enum(Severity, name="finding_severity"), default=Severity.medium, nullable=False, index=True
    )
    description: Mapped[str | None] = mapped_column(Text)
    recommendation: Mapped[str | None] = mapped_column(Text)

    # MITRE ATT&CK mapping
    mitre_tactic: Mapped[str | None] = mapped_column(String(100))
    mitre_technique_id: Mapped[str | None] = mapped_column(String(20))   # e.g. T1110
    mitre_technique_name: Mapped[str | None] = mapped_column(String(150))

    status: Mapped[VulnStatus] = mapped_column(
        Enum(VulnStatus, name="finding_status"), default=VulnStatus.open, nullable=False, index=True
    )

    # Single affected asset
    asset_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True
    )
    asset: Mapped[Asset] = relationship(lazy="selectin")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
