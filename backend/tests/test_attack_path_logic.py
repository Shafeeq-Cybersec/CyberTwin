"""Unit tests for Attack Path scoring and weakness reason logic."""

from app.services.attack_path_service import _likelihood, _weakness_reason
from app.services.risk_service import compute_risk
from tests.conftest import make_test_asset


class TestAttackPathLogic:
    """Verifies mathematical mapping of risk scores to exploit likelihoods and rationale clauses."""

    def test_likelihood_clamping(self):
        # Minimum bound 0.05
        assert _likelihood(0) == 0.05
        assert _likelihood(-20) == 0.05

        # Maximum bound 0.95
        assert _likelihood(100) == 0.95
        assert _likelihood(150) == 0.95

        # Intermediate values
        assert _likelihood(50) == 0.50
        assert _likelihood(80) == 0.80

    def test_weakness_reason_internet_exposure(self):
        asset = make_test_asset(internet_exposed=True)
        risk = compute_risk(asset)
        reason = _weakness_reason(asset, risk)
        assert reason == "it is exposed to the internet"

    def test_weakness_reason_missing_mfa(self):
        asset = make_test_asset(internet_exposed=False, missing_mfa=True)
        risk = compute_risk(asset)
        reason = _weakness_reason(asset, risk)
        assert reason == "it lacks multi-factor authentication"

    def test_weakness_reason_weak_password(self):
        asset = make_test_asset(internet_exposed=False, missing_mfa=False, weak_password=True)
        risk = compute_risk(asset)
        reason = _weakness_reason(asset, risk)
        assert reason == "it uses weak credentials"

    def test_weakness_reason_high_cvss(self):
        asset = make_test_asset(
            internet_exposed=False,
            missing_mfa=False,
            weak_password=False,
            cvss_score=8.5,
        )
        risk = compute_risk(asset)
        reason = _weakness_reason(asset, risk)
        assert "high-severity vulnerability (CVSS 8.5)" in reason

    def test_weakness_reason_misconfigured(self):
        asset = make_test_asset(
            internet_exposed=False,
            missing_mfa=False,
            weak_password=False,
            cvss_score=4.0,
            misconfigured=True,
        )
        risk = compute_risk(asset)
        reason = _weakness_reason(asset, risk)
        assert reason == "it is misconfigured"
