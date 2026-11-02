import type { RiskProfile } from "../../types/asset";
import { RISK_LEVEL_HEX, RISK_LEVEL_LABELS } from "../../types/asset";
import RiskBadge from "./RiskBadge";

/** Explainable breakdown of a risk score: summary + per-factor contribution bars. */
export default function RiskExplanation({ risk }: { risk: RiskProfile }) {
  const hex = RISK_LEVEL_HEX[risk.level];

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-semibold tabular-nums" style={{ color: hex }}>
              {risk.score}
            </span>
            <span className="text-slate-500 text-sm">/ 100</span>
          </div>
          <p className="text-xs uppercase tracking-wider text-slate-500 mt-1">
            {RISK_LEVEL_LABELS[risk.level]} risk
          </p>
        </div>
        <RiskBadge score={risk.score} level={risk.level} />
      </div>

      {/* Overall score bar */}
      <div className="mt-3 h-2 rounded-full bg-surface-900 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${risk.score}%`, backgroundColor: hex }} />
      </div>

      <p className="text-sm text-slate-400 mt-3">{risk.summary}</p>

      {/* Per-factor contributions */}
      {risk.factors.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {risk.factors.map((f) => (
            <li key={f.name}>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">{f.name}</span>
                <span className="text-slate-400 tabular-nums text-xs">
                  +{f.points} <span className="text-slate-600">/ {f.max_points}</span>
                </span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-surface-900 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(f.points / f.max_points) * 100}%`, backgroundColor: hex }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">{f.detail}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500 mt-4">No risk factors are currently contributing to this score.</p>
      )}
    </div>
  );
}
