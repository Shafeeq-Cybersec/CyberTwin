"""Schemas for the SOC dashboard aggregate endpoint."""

from pydantic import BaseModel


class DashboardKpis(BaseModel):
    """Headline KPI card values."""

    total_assets: int
    critical_assets: int
    internet_facing_assets: int
    high_risk_users: int
    critical_cves: int
    average_risk_score: int


class LabeledCount(BaseModel):
    """A single labeled bucket in a chart series."""

    label: str
    value: int


class DepartmentRisk(BaseModel):
    """Average risk score per department."""

    department: str
    average_risk: int
    asset_count: int


class TopVulnerability(BaseModel):
    """A high-impact vulnerability for the leaderboard chart."""

    id: str
    cve_id: str
    title: str | None
    severity: str
    cvss: float
    affected_assets: int


class DashboardData(BaseModel):
    """Everything the SOC dashboard needs in one payload."""

    kpis: DashboardKpis
    risk_distribution: list[LabeledCount]   # by risk level (green/yellow/orange/red)
    asset_types: list[LabeledCount]
    department_risk: list[DepartmentRisk]
    operating_systems: list[LabeledCount]
    top_vulnerabilities: list[TopVulnerability]
