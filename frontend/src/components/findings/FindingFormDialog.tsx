import { FormEvent, useEffect, useState } from "react";
import Modal from "../ui/Modal";
import * as findingsApi from "../../api/findings";
import * as assetsApi from "../../api/assets";
import type {
  Finding,
  FindingCatalog,
  FindingInput,
  FindingType,
  Severity,
  VulnStatus,
} from "../../types/finding";
import { FINDING_TYPE_LABELS, SEVERITY_LABELS, FINDING_STATUS_LABELS } from "../../types/finding";
import type { Asset } from "../../types/asset";
import { ASSET_TYPE_LABELS } from "../../types/asset";

interface FindingFormDialogProps {
  open: boolean;
  finding?: Finding | null; // present → edit mode
  onClose: () => void;
  onSubmit: (input: FindingInput) => Promise<void>;
}

const emptyForm: FindingInput = {
  finding_type: "missing_mfa",
  title: "",
  severity: "medium",
  description: "",
  recommendation: "",
  mitre_tactic: "",
  mitre_technique_id: "",
  mitre_technique_name: "",
  status: "open",
  asset_id: "",
};

/** Add/Edit finding dialog. Selecting a type auto-fills from the catalog. */
export default function FindingFormDialog({ open, finding, onClose, onSubmit }: FindingFormDialogProps) {
  const [form, setForm] = useState<FindingInput>(emptyForm);
  const [catalog, setCatalog] = useState<FindingCatalog | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Load the catalog + asset list once
  useEffect(() => {
    findingsApi.getCatalog().then(setCatalog).catch(() => setCatalog(null));
    assetsApi.listAssets({ page_size: 100 }).then((p) => setAssets(p.items)).catch(() => setAssets([]));
  }, []);

  useEffect(() => {
    if (!open) return;
    setError("");
    if (finding) {
      setForm({
        finding_type: finding.finding_type,
        title: finding.title,
        severity: finding.severity,
        description: finding.description ?? "",
        recommendation: finding.recommendation ?? "",
        mitre_tactic: finding.mitre_tactic ?? "",
        mitre_technique_id: finding.mitre_technique_id ?? "",
        mitre_technique_name: finding.mitre_technique_name ?? "",
        status: finding.status,
        asset_id: finding.asset_id,
      });
    } else {
      setForm(emptyForm);
    }
  }, [open, finding]);

  const set = <K extends keyof FindingInput>(key: K, value: FindingInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  // When the type changes on a *new* finding, pull defaults from the catalog
  const onTypeChange = (type: FindingType) => {
    const tpl = catalog?.[type];
    if (!finding && tpl) {
      setForm((f) => ({
        ...f,
        finding_type: type,
        title: tpl.title,
        severity: tpl.severity,
        description: tpl.description,
        recommendation: tpl.recommendation,
        mitre_tactic: tpl.mitre_tactic,
        mitre_technique_id: tpl.mitre_technique_id,
        mitre_technique_name: tpl.mitre_technique_name,
      }));
    } else {
      set("finding_type", type);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return setError("Title is required.");
    if (!form.asset_id) return setError("Select an affected asset.");
    setSaving(true);
    setError("");
    try {
      await onSubmit({
        ...form,
        description: form.description?.trim() || null,
        recommendation: form.recommendation?.trim() || null,
        mitre_tactic: form.mitre_tactic?.trim() || null,
        mitre_technique_id: form.mitre_technique_id?.trim() || null,
        mitre_technique_name: form.mitre_technique_name?.trim() || null,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.detail?.toString() ?? "Failed to save finding.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} title={finding ? "Edit Finding" : "Add Finding"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Finding Type">
            <select className="input" value={form.finding_type} onChange={(e) => onTypeChange(e.target.value as FindingType)}>
              {Object.entries(FINDING_TYPE_LABELS).map(([v, label]) => (
                <option key={v} value={v}>{label}</option>
              ))}
            </select>
          </Field>
          <Field label="Affected Asset *">
            <select className="input" value={form.asset_id} onChange={(e) => set("asset_id", e.target.value)} required>
              <option value="">Select asset…</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>{a.name} ({ASSET_TYPE_LABELS[a.asset_type]})</option>
              ))}
            </select>
          </Field>
          <Field label="Title *">
            <input className="input" value={form.title} onChange={(e) => set("title", e.target.value)} required />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Severity">
              <select className="input" value={form.severity} onChange={(e) => set("severity", e.target.value as Severity)}>
                {Object.entries(SEVERITY_LABELS).map(([v, label]) => (
                  <option key={v} value={v}>{label}</option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select className="input" value={form.status} onChange={(e) => set("status", e.target.value as VulnStatus)}>
                {Object.entries(FINDING_STATUS_LABELS).map(([v, label]) => (
                  <option key={v} value={v}>{label}</option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        <Field label="Description">
          <textarea className="input min-h-[70px] resize-y" value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} />
        </Field>
        <Field label="Recommendation">
          <textarea className="input min-h-[70px] resize-y" value={form.recommendation ?? ""} onChange={(e) => set("recommendation", e.target.value)} />
        </Field>

        {/* MITRE ATT&CK mapping */}
        <div className="border-t border-surface-700/60 pt-4">
          <p className="text-xs uppercase tracking-wider text-slate-500 mb-3">MITRE ATT&CK Mapping</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Tactic">
              <input className="input" value={form.mitre_tactic ?? ""} onChange={(e) => set("mitre_tactic", e.target.value)} placeholder="Credential Access" />
            </Field>
            <Field label="Technique ID">
              <input className="input" value={form.mitre_technique_id ?? ""} onChange={(e) => set("mitre_technique_id", e.target.value)} placeholder="T1110" />
            </Field>
            <Field label="Technique Name">
              <input className="input" value={form.mitre_technique_name ?? ""} onChange={(e) => set("mitre_technique_name", e.target.value)} placeholder="Brute Force" />
            </Field>
          </div>
        </div>

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
            {saving ? "Saving…" : finding ? "Save Changes" : "Create"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-wider text-slate-500 mb-1.5">{label}</span>
      {children}
    </label>
  );
}
