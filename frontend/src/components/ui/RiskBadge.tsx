import type { RiskLevel } from "../../types/asset";
import { RISK_LEVEL_LABELS, RISK_LEVEL_STYLES } from "../../types/asset";

interface RiskBadgeProps {
  score: number;
  level: RiskLevel;
  size?: "sm" | "md";
  showLabel?: boolean;
}

/** Displays a risk score (0–100) with its color-coded level. */
export default function RiskBadge({ score, level, size = "md", showLabel = true }: RiskBadgeProps) {
  const pad = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${pad} ${RISK_LEVEL_STYLES[level]}`}>
      <span className="tabular-nums">{score}</span>
      {showLabel && <span className="font-medium opacity-90">{RISK_LEVEL_LABELS[level]}</span>}
    </span>
  );
}
