"""Unit tests for the Risk Scoring Engine (app.services.risk_service)."""

from app.models.asset import Criticality
from app.schemas.risk import RiskLevel
from app.services.risk_service import (
    WEIGHTS,
    CRITICALITY_POINTS,
    compute_risk,
    _level_for,
    _summarize,
)
from tests.conftest import make_test_asset


class TestRiskScoringEngine:
    """Verifies factor calculation, weighting, thresholding, and rationale generation."""

    def test_zero_risk_asset(self):
        asset = make_test_asset(
            cvss_score=0.0,
            internet_exposed=False,
            criticality=Criticality.low,
            missing_mfa=False,
            weak_password=False,
            misconfigured=False,
            open_ports=0,
            business_importance=1,
        )
        profile = compute_risk(asset)
        assert profile.score == 0
        assert profile.level == RiskLevel.green
        assert len(profile.factors) == 0
        assert "No significant risk factors detected" in profile.summary

    def test_maximum_risk_asset_capped_at_100(self):
        asset = make_test_asset(
            cvss_score=10.0,
            internet_exposed=True,
            criticality=Criticality.critical,
            missing_mfa=True,
            weak_password=True,
            misconfigured=True,
            open_ports=25,  # Exceeds cap of 20
            business_importance=5,
        )
        profile = compute_risk(asset)
        assert profile.score == 100
        assert profile.level == RiskLevel.red
        assert len(profile.factors) == 8
        # Factors should be sorted descending by points
        points = [f.points for f in profile.factors]
        assert points == sorted(points, reverse=True)

    def test_cvss_score_scaling(self):
        # CVSS 10.0 => full weight 25
        asset_full = make_test_asset(cvss_score=10.0, criticality=Criticality.low)
        prof_full = compute_risk(asset_full)
        cvss_f = next(f for f in prof_full.factors if f.name == "CVSS Score")
        assert cvss_f.points == WEIGHTS["cvss"]
        assert cvss_f.max_points == WEIGHTS["cvss"]

        # CVSS 5.0 => half weight ~13
        asset_half = make_test_asset(cvss_score=5.0, criticality=Criticality.low)
        prof_half = compute_risk(asset_half)
        cvss_h = next(f for f in prof_half.factors if f.name == "CVSS Score")
        assert cvss_h.points == round(0.5 * WEIGHTS["cvss"])

    def test_internet_exposure_weight(self):
        asset = make_test_asset(internet_exposed=True, criticality=Criticality.low)
        profile = compute_risk(asset)
        exposure_f = next(f for f in profile.factors if f.name == "Internet Exposure")
        assert exposure_f.points == WEIGHTS["internet_exposure"]

    def test_criticality_levels_mapping(self):
        for crit, expected_pts in CRITICALITY_POINTS.items():
            asset = make_test_asset(criticality=crit)
            profile = compute_risk(asset)
            if expected_pts > 0:
                crit_f = next(f for f in profile.factors if f.name == "Critical Asset")
                assert crit_f.points == expected_pts
            else:
                assert not any(f.name == "Critical Asset" for f in profile.factors)

    def test_missing_mfa_and_weak_password_weights(self):
        asset = make_test_asset(missing_mfa=True, weak_password=True, criticality=Criticality.low)
        profile = compute_risk(asset)
        mfa_f = next(f for f in profile.factors if f.name == "Missing MFA")
        assert mfa_f.points == WEIGHTS["missing_mfa"]
        pwd_f = next(f for f in profile.factors if f.name == "Weak Password")
        assert pwd_f.points == WEIGHTS["weak_password"]

    def test_open_ports_saturation_cap(self):
        # 10 ports => 10/20 * 8 = 4 pts
        asset_10 = make_test_asset(open_ports=10, criticality=Criticality.low)
        prof_10 = compute_risk(asset_10)
        port_f = next(f for f in prof_10.factors if f.name == "Open Ports")
        assert port_f.points == 4

        # 50 ports => capped at 20 => 8 pts
        asset_50 = make_test_asset(open_ports=50, criticality=Criticality.low)
        prof_50 = compute_risk(asset_50)
        port_50_f = next(f for f in prof_50.factors if f.name == "Open Ports")
        assert port_50_f.points == WEIGHTS["open_ports"]

    def test_business_importance_scaling(self):
        # Level 1 => 0 pts (not added)
        asset_1 = make_test_asset(business_importance=1, criticality=Criticality.low)
        prof_1 = compute_risk(asset_1)
        assert not any(f.name == "Business Importance" for f in prof_1.factors)

        # Level 5 => 7 pts
        asset_5 = make_test_asset(business_importance=5, criticality=Criticality.low)
        prof_5 = compute_risk(asset_5)
        bi_f = next(f for f in prof_5.factors if f.name == "Business Importance")
        assert bi_f.points == WEIGHTS["business_importance"]

    def test_risk_level_thresholds(self):
        assert _level_for(100) == RiskLevel.red
        assert _level_for(75) == RiskLevel.red
        assert _level_for(74) == RiskLevel.orange
        assert _level_for(50) == RiskLevel.orange
        assert _level_for(49) == RiskLevel.yellow
        assert _level_for(25) == RiskLevel.yellow
        assert _level_for(24) == RiskLevel.green
        assert _level_for(0) == RiskLevel.green

    def test_summary_generation_with_factors(self):
        asset = make_test_asset(
            cvss_score=9.0,
            internet_exposed=True,
            missing_mfa=True,
            criticality=Criticality.critical,
        )
        profile = compute_risk(asset)
        assert "Driven primarily by" in profile.summary
        assert "cvss score" in profile.summary
