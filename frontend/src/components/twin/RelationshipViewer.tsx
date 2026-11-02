import { ArrowRight, Pencil, Trash2 } from "lucide-react";
import type { RelationshipView } from "../../types/twin";
import { RELATIONSHIP_LABELS } from "../../types/twin";
import { ASSET_TYPE_LABELS } from "../../types/asset";
import { RELATIONSHIP_COLORS } from "./assetVisuals";

interface RelationshipViewerProps {
  relationships: RelationshipView[];
  loading: boolean;
  onEdit: (rel: RelationshipView) => void;
  onDelete: (rel: RelationshipView) => void;
}

/** Table listing every relationship with edit/delete controls. */
export default function RelationshipViewer({
  relationships,
  loading,
  onEdit,
  onDelete,
}: RelationshipViewerProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (relationships.length === 0) {
    return (
      <p className="text-center text-sm text-slate-500 py-12">
        No relationships yet. Use “Create Relationship” to connect two assets.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-surface-700/60">
            <th className="px-4 py-2.5 font-medium">Source</th>
            <th className="px-4 py-2.5 font-medium">Relationship</th>
            <th className="px-4 py-2.5 font-medium">Target</th>
            <th className="px-4 py-2.5 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-700/40">
          {relationships.map((r) => (
            <tr key={r.id} className="hover:bg-surface-700/30 transition-colors">
              <td className="px-4 py-2.5">
                <div className="text-slate-100">{r.source_name}</div>
                <div className="text-xs text-slate-500">{ASSET_TYPE_LABELS[r.source_type]}</div>
              </td>
              <td className="px-4 py-2.5">
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded border"
                  style={{
                    color: RELATIONSHIP_COLORS[r.type],
                    borderColor: `${RELATIONSHIP_COLORS[r.type]}40`,
                    backgroundColor: `${RELATIONSHIP_COLORS[r.type]}14`,
                  }}
                >
                  {RELATIONSHIP_LABELS[r.type]}
                  <ArrowRight className="w-3 h-3" />
                </span>
              </td>
              <td className="px-4 py-2.5">
                <div className="text-slate-100">{r.target_name}</div>
                <div className="text-xs text-slate-500">{ASSET_TYPE_LABELS[r.target_type]}</div>
              </td>
              <td className="px-4 py-2.5">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => onEdit(r)}
                    className="p-1.5 rounded-lg hover:bg-surface-600 text-slate-400 hover:text-accent"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(r)}
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
  );
}
