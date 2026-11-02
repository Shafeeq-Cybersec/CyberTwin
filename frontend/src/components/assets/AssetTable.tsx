import { useNavigate } from "react-router-dom";
import { ArrowUpDown, Pencil, Trash2 } from "lucide-react";
import Badge from "../ui/Badge";
import RiskBadge from "../ui/RiskBadge";
import type { Asset, AssetQuery } from "../../types/asset";
import {
  ASSET_TYPE_LABELS,
  CRITICALITY_LABELS,
  CRITICALITY_STYLES,
  STATUS_LABELS,
  STATUS_STYLES,
} from "../../types/asset";

interface AssetTableProps {
  assets: Asset[];
  loading: boolean;
  sortBy: AssetQuery["sort_by"];
  sortOrder: AssetQuery["sort_order"];
  onSort: (field: "name" | "risk") => void;
  onEdit: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
}

/** Sortable asset table with row actions. Clicking a row opens details. */
export default function AssetTable({
  assets,
  loading,
  sortBy,
  sortOrder,
  onSort,
  onEdit,
  onDelete,
}: AssetTableProps) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="card flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="card text-center py-20 text-slate-400 text-sm">
        No assets match your filters. Try adjusting the search or add a new asset.
      </div>
    );
  }

  // Header cell for sortable columns
  const SortHeader = ({ field, label }: { field: "name" | "risk"; label: string }) => (
    <button
      onClick={() => onSort(field)}
      className={`flex items-center gap-1 hover:text-slate-200 ${sortBy === field ? "text-accent" : ""}`}
    >
      {label}
      <ArrowUpDown className="w-3.5 h-3.5" />
      {sortBy === field && <span className="text-[10px]">{sortOrder === "asc" ? "↑" : "↓"}</span>}
    </button>
  );

  return (
    <div className="card p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-surface-700/60">
              <th className="px-4 py-3 font-medium"><SortHeader field="name" label="Name" /></th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Hostname / IP</th>
              <th className="px-4 py-3 font-medium"><SortHeader field="risk" label="Risk" /></th>
              <th className="px-4 py-3 font-medium">Criticality</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Owner</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-700/40">
            {assets.map((a) => (
              <tr
                key={a.id}
                onClick={() => navigate(`/assets/${a.id}`)}
                className="hover:bg-surface-700/30 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3 font-medium text-slate-100">{a.name}</td>
                <td className="px-4 py-3 text-slate-400">{ASSET_TYPE_LABELS[a.asset_type]}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-400">
                  <div>{a.hostname || "—"}</div>
                  <div className="text-slate-500">{a.ip_address || "—"}</div>
                </td>
                <td className="px-4 py-3">
                  <RiskBadge score={a.risk.score} level={a.risk.level} size="sm" />
                </td>
                <td className="px-4 py-3">
                  <Badge className={CRITICALITY_STYLES[a.criticality]}>{CRITICALITY_LABELS[a.criticality]}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge className={STATUS_STYLES[a.status]}>{STATUS_LABELS[a.status]}</Badge>
                </td>
                <td className="px-4 py-3 text-slate-400">{a.owner || "—"}</td>
                <td className="px-4 py-3">
                  {/* stopPropagation so action buttons don't trigger row navigation */}
                  <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onEdit(a)}
                      className="p-1.5 rounded-lg hover:bg-surface-600 text-slate-400 hover:text-accent"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(a)}
                      className="p-1.5 rounded-lg hover:bg-surface-600 text-slate-400 hover:text-severity-critical"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
