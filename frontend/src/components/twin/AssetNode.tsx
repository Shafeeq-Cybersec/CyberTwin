import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { ASSET_ICONS } from "./assetVisuals";
import type { AssetType, Criticality, AssetStatus, RiskLevel } from "../../types/asset";
import { ASSET_TYPE_LABELS, RISK_LEVEL_HEX, RISK_LEVEL_LABELS } from "../../types/asset";

// Data carried by each React Flow node
export interface AssetNodeData {
  label: string;
  assetType: AssetType;
  criticality: Criticality;
  status: AssetStatus;
  hostname: string | null;
  riskScore: number;
  riskLevel: RiskLevel;
  dimmed: boolean; // faded when it doesn't match the active search/filter
}

// Translucent glow derived from the solid risk color
const glow = (hex: string) => `${hex}59`; // ~35% alpha

/**
 * Custom twin node: type icon, name, risk score, and a risk-colored
 * border/glow. Handles on all four sides let edges connect from any direction.
 */
function AssetNode({ data, selected }: NodeProps<AssetNodeData>) {
  const Icon = ASSET_ICONS[data.assetType];
  const color = RISK_LEVEL_HEX[data.riskLevel];

  return (
    <div
      className="rounded-xl border-2 bg-surface-800 px-3 py-2.5 w-44 transition-opacity"
      style={{
        borderColor: color,
        boxShadow: selected ? `0 0 0 2px ${color}, 0 0 22px ${glow(color)}` : `0 0 16px ${glow(color)}`,
        opacity: data.dimmed ? 0.25 : 1,
      }}
    >
      {/* Connection handles (targets on top/left, sources on bottom/right) */}
      <Handle type="target" position={Position.Top} className="!bg-slate-500 !w-2 !h-2" />
      <Handle type="target" position={Position.Left} className="!bg-slate-500 !w-2 !h-2" />

      <div className="flex items-center gap-2.5">
        <div className="p-1.5 rounded-lg bg-surface-900 shrink-0" style={{ color }}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-100 truncate">{data.label}</p>
          <p className="text-[11px] text-slate-500 truncate">{ASSET_TYPE_LABELS[data.assetType]}</p>
        </div>
        {/* Risk score chip */}
        <div
          className="shrink-0 text-xs font-semibold tabular-nums rounded-md px-1.5 py-0.5"
          style={{ color, backgroundColor: `${color}1f` }}
          title={`${RISK_LEVEL_LABELS[data.riskLevel]} risk`}
        >
          {data.riskScore}
        </div>
      </div>

      {/* Risk level tag */}
      <div className="flex items-center gap-1.5 mt-2">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-[10px] uppercase tracking-wide" style={{ color }}>
          {RISK_LEVEL_LABELS[data.riskLevel]} Risk
        </span>
        {data.hostname && <span className="text-[10px] text-slate-600 truncate font-mono ml-auto">{data.hostname}</span>}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-slate-500 !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-slate-500 !w-2 !h-2" />
    </div>
  );
}

export default memo(AssetNode);
