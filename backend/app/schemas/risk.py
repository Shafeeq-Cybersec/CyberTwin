"""Schemas for the Risk Scoring Engine."""

import enum

from pydantic import BaseModel


class RiskLevel(str, enum.Enum):
    """Color-coded risk band."""

    green = "green"
    yellow = "yellow"
    orange = "orange"
    red = "red"


class RiskFactor(BaseModel):
    """A single contributing factor in the risk explanation."""

    name: str
    points: int
    max_points: int
    detail: str


class RiskProfile(BaseModel):
    """The full explainable risk result for an asset."""

    score: int  # 0–100
    level: RiskLevel
    factors: list[RiskFactor]
    summary: str
