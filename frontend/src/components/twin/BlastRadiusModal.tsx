import { X, Flame, ShieldCheck } from "lucide-react";
import type { BlastRadiusResponse } from "../../types/twin";
import { ASSET_TYPE_LABELS, CRITICALITY_LABELS, CRITICALITY_STYLES } from "../../types/asset";
import RiskBadge from "../ui/RiskBadge";
import Badge from "../ui/Badge";

interface BlastRadiusModalProps {
  data: BlastRadiusResponse | null;
  loading: boolean;
  onClose: () => void;
}

export default function BlastRadiusModal({ data, loading, onClose }: BlastRadiusModalProps) {
  if (!data && !loading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-surface-900 border border-surface-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-700/60 bg-surface-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-severity-critical/10 border border-severity-critical/20 text-severity-critical">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                Simulated Blast Radius
              </h3>
              <p className="text-xs text-slate-400">
                Cascading impact analysis if <span className="text-accent font-medium">{data?.source_name}</span> is compromised
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-surface-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-400">Traversing graph dependencies & calculating breach probability…</p>
            </div>
          ) : data ? (
            <>
              {/* Summary KPIs */}
              <div className="grid grid-cols-3 gap-3">
                <div className="card bg-surface-800/60 border border-surface-700/50 p-4 text-center">
                  <span className="text-xs uppercase tracking-wider text-slate-400 block mb-1">Impact Score</span>
                  <span className="text-2xl font-bold text-severity-critical font-mono">
                    {data.estimated_impact_score}<span className="text-xs text-slate-500">/100</span>
                  </span>
                </div>
                <div className="card bg-surface-800/60 border border-surface-700/50 p-4 text-center">
                  <span className="text-xs uppercase tracking-wider text-slate-400 block mb-1">Downstream Assets</span>
                  <span className="text-2xl font-bold text-slate-100 font-mono">
                    {data.total_affected}
                  </span>
                </div>
                <div className="card bg-surface-800/60 border border-surface-700/50 p-4 text-center">
                  <span className="text-xs uppercase tracking-wider text-slate-400 block mb-1">Crown Jewels</span>
                  <span className={`text-2xl font-bold font-mono ${data.crown_jewel_at_risk ? "text-severity-critical" : "text-severity-low"}`}>
                    {data.crown_jewel_at_risk ? "At Risk" : "Safe"}
                  </span>
                </div>
              </div>

              {/* Recommended Mitigation */}
              <div className="p-4 rounded-xl bg-accent/5 border border-accent/20 flex gap-3 items-start">
                <ShieldCheck className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs uppercase tracking-wider font-semibold text-accent mb-1">
                    Automated Containment Plan
                  </h4>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {data.recommended_mitigation}
                  </p>
                </div>
              </div>

              {/* Affected Nodes Breakdown */}
              <div>
                <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-3 flex items-center justify-between">
                  <span>Downstream Affected Infrastructure</span>
                  <span className="text-slate-500 font-normal">{data.affected_nodes.length} targets identified</span>
                </h4>

                {data.affected_nodes.length === 0 ? (
                  <p className="text-sm text-slate-500 py-4 text-center bg-surface-800/30 rounded-xl">
                    No downstream dependencies reachable from this node.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {data.affected_nodes.map((node) => (
                      <div
                        key={node.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-surface-800/50 border border-surface-700/40 hover:border-surface-600 transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className="px-2 py-0.5 rounded text-xs font-mono bg-surface-700 text-slate-300">
                            Hop {node.hops_away}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-200">{node.name}</div>
                            <div className="text-xs text-slate-500">
                              {ASSET_TYPE_LABELS[node.asset_type]}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-xs text-slate-400">Breach Prob.</div>
                            <div className="text-xs font-mono font-semibold text-severity-high">
                              {node.compromise_probability}%
                            </div>
                          </div>
                          <Badge className={CRITICALITY_STYLES[node.criticality]}>
                            {CRITICALITY_LABELS[node.criticality]}
                          </Badge>
                          <RiskBadge score={node.risk_score} level={node.risk_level} size="sm" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-surface-700/60 bg-surface-800/30 flex justify-end">
          <button onClick={onClose} className="btn-secondary text-sm">
            Close Simulation
          </button>
        </div>
      </div>
    </div>
  );
}

