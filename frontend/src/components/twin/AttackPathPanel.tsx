import { ArrowRight, Crosshair, ShieldOff, ArrowDown, X } from "lucide-react";
import type { AttackPath } from "../../types/twin";
import { RELATIONSHIP_LABELS } from "../../types/twin";

interface AttackPathPanelProps {
  paths: AttackPath[];
  loading: boolean;
  selected: AttackPath | null;
  onSelect: (p: AttackPath | null) => void;
  onClose: () => void;
}

// Color a probability value: higher = more dangerous (red).
function probColor(p: number): string {
  if (p >= 50) return "#f43f5e";
  if (p >= 25) return "#fb923c";
  if (p >= 10) return "#facc15";
  return "#4ade80";
}

/** Side panel listing attack paths and detailing the selected one. */
export default function AttackPathPanel({ paths, loading, selected, onSelect, onClose }: AttackPathPanelProps) {
  return (
    <div className="absolute top-3 right-3 bottom-3 w-80 bg-surface-800/95 backdrop-blur border border-surface-600 rounded-xl shadow-glow flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-700/60">
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-100">
          <Crosshair className="w-4 h-4 text-severity-critical" /> Attack Paths
        </span>
        <button onClick={onClose} className="p-1 rounded hover:bg-surface-700 text-slate-400">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : paths.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-10">
            No attack paths found. Connect internet-facing or endpoint assets to critical targets in the graph.
          </p>
        ) : selected ? (
          <SelectedPath path={selected} onBack={() => onSelect(null)} />
        ) : (
          <ul className="space-y-2">
            {paths.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => onSelect(p)}
                  className="w-full text-left rounded-lg border border-surface-600/60 bg-surface-900 hover:border-severity-critical/40 hover:bg-surface-700/40 px-3 py-2.5 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-400">{p.length} hop{p.length === 1 ? "" : "s"}</span>
                    <span className="text-xs font-semibold tabular-nums" style={{ color: probColor(p.probability) }}>
                      {p.probability}% likely
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-slate-200">
                    <span className="truncate">{p.entry_name}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate text-severity-critical">{p.target_name}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/** Detail view for a single selected attack path. */
function SelectedPath({ path, onBack }: { path: AttackPath; onBack: () => void }) {
  return (
    <div>
      <button onClick={onBack} className="text-xs text-slate-400 hover:text-slate-200 mb-3">
        ← All paths
      </button>

      {/* Probability + summary */}
      <div className="rounded-lg bg-surface-900 px-3 py-3 mb-3">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-semibold tabular-nums" style={{ color: probColor(path.probability) }}>
            {path.probability}%
          </span>
          <span className="text-xs text-slate-500">attack probability</span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          {path.entry_name} → {path.target_name} · {path.length} hop{path.length === 1 ? "" : "s"}
        </p>
      </div>

      {/* Weakest link */}
      <div className="rounded-lg border border-severity-high/20 bg-severity-high/5 px-3 py-2.5 mb-4">
        <div className="flex items-center gap-2 mb-0.5">
          <ShieldOff className="w-4 h-4 text-severity-high" />
          <span className="text-xs uppercase tracking-wider text-severity-high font-medium">Weakest Link</span>
        </div>
        <p className="text-sm text-slate-200">{path.weakest_link_name}</p>
        <p className="text-xs text-slate-500">Risk score {path.weakest_link_score}/100 — the path's point of least resistance.</p>
      </div>

      {/* Steps */}
      <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Attack Steps</p>
      <ol className="space-y-0">
        {/* Entry node */}
        <li className="flex items-center gap-2 text-sm text-slate-200">
          <span className="w-6 h-6 rounded-full bg-surface-700 text-xs flex items-center justify-center shrink-0">0</span>
          {path.nodes[0]?.name}
          <span className="text-xs text-slate-500">(entry)</span>
        </li>
        {path.steps.map((s, i) => (
          <li key={i}>
            <div className="flex justify-center py-1">
              <ArrowDown className="w-4 h-4 text-slate-600" />
            </div>
            <div className="flex items-start gap-2">
              <span className="w-6 h-6 rounded-full bg-surface-700 text-xs flex items-center justify-center shrink-0">{i + 1}</span>
              <div className="min-w-0">
                <p className="text-sm text-slate-200">
                  {s.to_name}
                  <span className="ml-1.5 text-[10px] uppercase tracking-wide text-accent">{RELATIONSHIP_LABELS[s.relationship]}</span>
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{s.explanation}</p>
                <p className="text-[11px] text-slate-600 mt-0.5">Step likelihood: {s.step_probability}%</p>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
