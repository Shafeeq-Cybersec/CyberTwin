"""Unit tests for Choke-Point & Minimum-Cut Remediation Optimizer."""

from app.services.chokepoint_optimizer import compute_optimal_remediations


class TestChokepointOptimizer:
    """Tests bottleneck asset identification, elimination impact, and remediation ranking."""

    def test_empty_attack_paths(self):
        result = compute_optimal_remediations([], {})
        assert result == []

    def test_single_hop_paths_have_no_intermediate_chokepoints(self):
        # A single-hop path has only entry node and target node, no intermediate hops
        paths = [
            {"nodes": [{"id": "entry-1"}, {"id": "target-1"}]}
        ]
        result = compute_optimal_remediations(paths, {})
        assert result == []

    def test_single_bottleneck_intermediate_asset(self):
        # Two paths both routing through node "jump-box"
        paths = [
            {
                "nodes": [
                    {"id": "attacker"},
                    {"id": "jump-box"},
                    {"id": "db-server"},
                ]
            },
            {
                "nodes": [
                    {"id": "phished-user"},
                    {"id": "jump-box"},
                    {"id": "domain-controller"},
                ]
            },
        ]
        assets_lookup = {
            "jump-box": {
                "name": "Bastion Jump Box",
                "risk_score": 85,
            }
        }
        remediations = compute_optimal_remediations(paths, assets_lookup)
        assert len(remediations) == 1
        rec = remediations[0]
        assert rec["asset_id"] == "jump-box"
        assert rec["asset_name"] == "Bastion Jump Box"
        assert rec["paths_eliminated"] == 2
        assert rec["elimination_percentage"] == 100.0
        assert rec["risk_score"] == 85
        assert "Eliminates 100.0% of active lateral paths" in rec["recommended_control"]

    def test_ranking_by_elimination_percentage_and_risk(self):
        # 3 paths total:
        # Node A appears in 2 paths (66.7%)
        # Node B appears in 1 path with high risk (33.3%, risk 90)
        # Node C appears in 2 paths with lower risk (66.7%, risk 40)
        paths = [
            {"nodes": [{"id": "s"}, {"id": "node-A"}, {"id": "node-C"}, {"id": "t1"}]},
            {"nodes": [{"id": "s"}, {"id": "node-A"}, {"id": "node-C"}, {"id": "t2"}]},
            {"nodes": [{"id": "s"}, {"id": "node-B"}, {"id": "t3"}]},
        ]
        assets_lookup = {
            "node-A": {"name": "Node A", "risk_score": 80},
            "node-B": {"name": "Node B", "risk_score": 90},
            "node-C": {"name": "Node C", "risk_score": 40},
        }
        remediations = compute_optimal_remediations(paths, assets_lookup)
        assert len(remediations) == 3

        # First two should have 66.7% elimination
        assert remediations[0]["elimination_percentage"] == 66.7
        assert remediations[1]["elimination_percentage"] == 66.7
        # Between node-A and node-C (both 66.7%), node-A has higher risk (80 vs 40)
        assert remediations[0]["asset_id"] == "node-A"
        assert remediations[1]["asset_id"] == "node-C"

        # Third is node-B (33.3%)
        assert remediations[2]["asset_id"] == "node-B"
        assert remediations[2]["elimination_percentage"] == 33.3

    def test_missing_asset_lookup_fallback(self):
        paths = [
            {"nodes": [{"id": "s"}, {"id": "unknown-node-12345678"}, {"id": "t"}]}
        ]
        remediations = compute_optimal_remediations(paths, {})
        assert len(remediations) == 1
        assert remediations[0]["asset_id"] == "unknown-node-12345678"
        assert "Asset unknown-" in remediations[0]["asset_name"]
        assert remediations[0]["risk_score"] == 50
