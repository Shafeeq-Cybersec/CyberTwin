import { FormEvent, useEffect, useMemo, useState } from "react";
import Modal from "../ui/Modal";
import * as twinApi from "../../api/twin";
import type {
  GraphNode,
  RelationshipRules,
  RelationshipType,
  RelationshipView,
} from "../../types/twin";
import { RELATIONSHIP_LABELS, RELATIONSHIP_TYPES } from "../../types/twin";
import { ASSET_TYPE_LABELS } from "../../types/asset";

interface RelationshipDialogProps {
  open: boolean;
  nodes: GraphNode[];
  rules: RelationshipRules | null;
  /** Present → edit mode. */
  editing?: RelationshipView | null;
  /** Optional prefill when drawing an edge on the canvas. */
  prefill?: { source: string; target: string } | null;
  onClose: () => void;
  onSaved: () => void; // triggers a graph refetch
}

/**
 * Create/Edit relationship dialog. Uses the backend rule matrix to offer
 * only valid source/target assets for the chosen relationship type, so
 * invalid combinations can't be submitted in the first place.
 */
export default function RelationshipDialog({
  open,
  nodes,
  rules,
  editing,
  prefill,
  onClose,
  onSaved,
}: RelationshipDialogProps) {
  const [type, setType] = useState<RelationshipType>("USES");
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Initialise the form each time the dialog opens
  useEffect(() => {
    if (!open) return;
    setError("");
    if (editing) {
      setType(editing.type);
      setSource(editing.source);
      setTarget(editing.target);
    } else {
      setType("USES");
      setSource(prefill?.source ?? "");
      setTarget(prefill?.target ?? "");
    }
  }, [open, editing, prefill]);

  // Assets eligible as source/target for the selected relationship type
  const { validSources, validTargets } = useMemo(() => {
    const rule = rules?.[type];
    const srcTypes = rule ? new Set(rule.sources) : null;
    const tgtTypes = rule ? new Set(rule.targets) : null;
    return {
      validSources: srcTypes ? nodes.filter((n) => srcTypes.has(n.asset_type)) : nodes,
      validTargets: tgtTypes ? nodes.filter((n) => tgtTypes.has(n.asset_type)) : nodes,
    };
  }, [rules, type, nodes]);

  // If a chosen asset becomes invalid after switching type, clear it
  useEffect(() => {
    if (source && !validSources.some((n) => n.id === source)) setSource("");
    if (target && !validTargets.some((n) => n.id === target)) setTarget("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!source || !target) return setError("Select both a source and a target asset.");
    if (source === target) return setError("An asset cannot relate to itself.");

    setSaving(true);
    setError("");
    try {
      const payload = { source, target, type };
      if (editing) {
        await twinApi.updateRelationship(editing.id, payload);
      } else {
        await twinApi.createRelationship(payload);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.detail?.toString() ?? "Failed to save relationship.");
    } finally {
      setSaving(false);
    }
  };

  const AssetOptions = ({ list }: { list: GraphNode[] }) =>
    list.map((n) => (
      <option key={n.id} value={n.id}>
        {n.name} ({ASSET_TYPE_LABELS[n.asset_type]})
      </option>
    ));

  return (
    <Modal open={open} title={editing ? "Edit Relationship" : "Create Relationship"} onClose={onClose} widthClass="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Relationship type first — it constrains the asset choices */}
        <label className="block">
          <span className="block text-xs uppercase tracking-wider text-slate-500 mb-1.5">Relationship</span>
          <select className="input" value={type} onChange={(e) => setType(e.target.value as RelationshipType)}>
            {RELATIONSHIP_TYPES.map((t) => (
              <option key={t} value={t}>{RELATIONSHIP_LABELS[t]}</option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="block text-xs uppercase tracking-wider text-slate-500 mb-1.5">Source</span>
            <select className="input" value={source} onChange={(e) => setSource(e.target.value)} required>
              <option value="">Select source…</option>
              <AssetOptions list={validSources} />
            </select>
          </label>
          <label className="block">
            <span className="block text-xs uppercase tracking-wider text-slate-500 mb-1.5">Target</span>
            <select className="input" value={target} onChange={(e) => setTarget(e.target.value)} required>
              <option value="">Select target…</option>
              <AssetOptions list={validTargets} />
            </select>
          </label>
        </div>

        {/* Live preview of the sentence being built */}
        <p className="text-sm text-slate-400 bg-surface-900 rounded-lg px-3 py-2">
          {nodes.find((n) => n.id === source)?.name ?? "—"}
          <span className="text-accent font-medium"> {RELATIONSHIP_LABELS[type]} </span>
          {nodes.find((n) => n.id === target)?.name ?? "—"}
        </p>

        {(validSources.length === 0 || validTargets.length === 0) && (
          <p className="text-xs text-severity-medium">
            No compatible assets for this relationship type. Add the required asset types first.
          </p>
        )}

        {error && (
          <p className="text-sm text-severity-critical bg-severity-critical/10 border border-severity-critical/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm rounded-lg text-slate-400 hover:bg-surface-700">
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving…" : editing ? "Save Changes" : "Create"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
