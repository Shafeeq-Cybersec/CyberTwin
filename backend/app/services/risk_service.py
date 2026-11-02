"""Risk Scoring Engine.

Turns an asset's risk factors into an explainable 0–100 score and a
color-coded level. Each factor contributes a bounded number of points; the
weights are chosen so the maximum possible total is exactly 100, which keeps
the score directly interpretable as a percentage of "worst case".

The engine is deterministic and pure — given the same asset it always returns
the same result — and every point awarded is itemised in the explanation so
the score is fully auditable.
"""

import enum

from app.models.asset import Asset, Criticality
from app.schemas.risk import RiskFactor, RiskLevel, RiskProfile

# Maximum points each factor can contribute. Sum == 100.
WEIGHTS = {
    "cvss": 25,
    "internet_exposure": 15,
    "critical_asset": 13,
    "missing_mfa": 12,
    "weak_password": 10,
    "misconfiguration": 10,
    "open_ports": 8,
    "business_importance": 7,
}

# Points per criticality for the "critical asset" factor.
CRITICALITY_POINTS = {
    Criticality.critical: WEIGHTS["critical_asset"],
    Criticality.high: 9,
    Criticality.medium: 4,
    Criticality.low: 0,
}

# Open-port count at which this factor saturates to its full weight.
OPEN_PORTS_CAP = 20


class RiskThreshold(int, enum.Enum):
    """Lower bounds (inclusive) for each risk level."""

    RED = 75
    ORANGE = 50
    YELLOW = 25
    GREEN = 0


def _level_for(score: int) -> RiskLevel:
    """Map a numeric score to its color-coded level."""
    if score >= RiskThreshold.RED:
        return RiskLevel.red
    if score >= RiskThreshold.ORANGE:
        return RiskLevel.orange
    if score >= RiskThreshold.YELLOW:
        return RiskLevel.yellow
    return RiskLevel.green


def compute_risk(asset: Asset) -> RiskProfile:
    """Compute the explainable risk profile for a single asset."""
    factors: list[RiskFactor] = []

    def add(name: str, points: int, detail: str) -> None:
        """Record a contributing factor (only if it added points)."""
        if points > 0:
            factors.append(RiskFactor(name=name, points=points, max_points=_max_for(name), detail=detail))

    # 1. CVSS — scaled linearly from the 0–10 CVSS scale
    cvss = max(0.0, min(asset.cvss_score or 0.0, 10.0))
    cvss_pts = round(cvss / 10 * WEIGHTS["cvss"])
    add("CVSS Score", cvss_pts, f"Highest CVSS of {cvss:.1f} contributes to exploitability risk.")

    # 2. Internet exposure
    if asset.internet_exposed:
        add("Internet Exposure", WEIGHTS["internet_exposure"], "Asset is reachable from the public internet.")

    # 3. Critical asset (from criticality classification)
    crit_pts = CRITICALITY_POINTS.get(asset.criticality, 0)
    add("Critical Asset", crit_pts, f"Classified as {asset.criticality.value} criticality.")

    # 4. Missing MFA
    if asset.missing_mfa:
        add("Missing MFA", WEIGHTS["missing_mfa"], "Multi-factor authentication is not enforced.")

    # 5. Weak password
    if asset.weak_password:
        add("Weak Password", WEIGHTS["weak_password"], "Weak or default credentials detected.")

    # 6. Misconfiguration
    if asset.misconfigured:
        add("Misconfiguration", WEIGHTS["misconfiguration"], "Insecure configuration identified.")

    # 7. Open ports — scaled up to the cap
    ports = max(0, asset.open_ports or 0)
    port_pts = round(min(ports, OPEN_PORTS_CAP) / OPEN_PORTS_CAP * WEIGHTS["open_ports"])
    add("Open Ports", port_pts, f"{ports} open port(s) increase the attack surface.")

    # 8. Business importance (1–5)
    bi = max(1, min(asset.business_importance or 1, 5))
    bi_pts = round((bi - 1) / 4 * WEIGHTS["business_importance"])
    add("Business Importance", bi_pts, f"Business importance rated {bi}/5.")

    score = min(sum(f.points for f in factors), 100)
    level = _level_for(score)

    # Order the explanation by impact, highest first
    factors.sort(key=lambda f: f.points, reverse=True)

    return RiskProfile(
        score=score,
        level=level,
        factors=factors,
        summary=_summarize(score, level, factors),
    )


def _max_for(name: str) -> int:
    """Look up a factor's max points by its display name."""
    key = {
        "CVSS Score": "cvss",
        "Internet Exposure": "internet_exposure",
        "Critical Asset": "critical_asset",
        "Missing MFA": "missing_mfa",
        "Weak Password": "weak_password",
        "Misconfiguration": "misconfiguration",
        "Open Ports": "open_ports",
        "Business Importance": "business_importance",
    }[name]
    return WEIGHTS[key]


def _summarize(score: int, level: RiskLevel, factors: list[RiskFactor]) -> str:
    """Build a one-line, human-readable rationale for the score."""
    if not factors:
        return f"Risk {score}/100 ({level.value}). No significant risk factors detected."
    top = ", ".join(f.name.lower() for f in factors[:3])
    return f"Risk {score}/100 ({level.value}). Driven primarily by {top}."
