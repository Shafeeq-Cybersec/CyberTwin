import { Search } from "lucide-react";
import type { AssetQuery } from "../../types/asset";
import {
  ASSET_TYPE_LABELS,
  CRITICALITY_LABELS,
  STATUS_LABELS,
} from "../../types/asset";

interface AssetFiltersProps {
  query: AssetQuery;
  onChange: (patch: Partial<AssetQuery>) => void;
}

/** Search bar + dropdown filters row for the asset table. */
export default function AssetFilters({ query, onChange }: AssetFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-3">
      {/* Search */}
      <div className="flex items-center gap-2 bg-surface-800 border border-surface-600/50 rounded-lg px-3 py-2 flex-1 min-w-0">
        <Search className="w-4 h-4 text-slate-500 shrink-0" />
        <input
          className="bg-transparent outline-none text-sm w-full placeholder-slate-500"
          placeholder="Search by name, hostname, IP, or owner…"
          value={query.search ?? ""}
          onChange={(e) => onChange({ search: e.target.value })}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select
          className="input w-auto py-2"
          value={query.asset_type ?? ""}
          onChange={(e) => onChange({ asset_type: (e.target.value || undefined) as AssetQuery["asset_type"] })}
        >
          <option value="">All Types</option>
          {Object.entries(ASSET_TYPE_LABELS).map(([v, label]) => (
            <option key={v} value={v}>{label}</option>
          ))}
        </select>

        <select
          className="input w-auto py-2"
          value={query.criticality ?? ""}
          onChange={(e) => onChange({ criticality: (e.target.value || undefined) as AssetQuery["criticality"] })}
        >
          <option value="">All Criticality</option>
          {Object.entries(CRITICALITY_LABELS).map(([v, label]) => (
            <option key={v} value={v}>{label}</option>
          ))}
        </select>

        <select
          className="input w-auto py-2"
          value={query.status ?? ""}
          onChange={(e) => onChange({ status: (e.target.value || undefined) as AssetQuery["status"] })}
        >
          <option value="">All Status</option>
          {Object.entries(STATUS_LABELS).map(([v, label]) => (
            <option key={v} value={v}>{label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
