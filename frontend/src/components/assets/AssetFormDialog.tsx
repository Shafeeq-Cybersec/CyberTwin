import { FormEvent, useEffect, useState } from "react";
import Modal from "../ui/Modal";
import type {
  Asset,
  AssetInput,
  AssetStatus,
  AssetType,
  Criticality,
} from "../../types/asset";
import {
  ASSET_TYPE_LABELS,
  CRITICALITY_LABELS,
  STATUS_LABELS,
} from "../../types/asset";

interface AssetFormDialogProps {
  open: boolean;
  /** When provided the dialog is in "edit" mode, otherwise "add". */
  asset?: Asset | null;
  onClose: () => void;
  onSubmit: (input: AssetInput) => Promise<void>;
}

// Sensible defaults for the "add" flow
const emptyForm: AssetInput = {
  name: "",
  hostname: "",
  ip_address: "",
  asset_type: "server",
  operating_system: "",
  owner: "",
  department: "",
  criticality: "medium",
  status: "active",
  tags: [],
  description: "",
  // Risk factors
  cvss_score: 0,
  internet_exposed: false,
  missing_mfa: false,
  weak_password: false,
  misconfigured: false,
  open_ports: 0,
  business_importance: 3,
};

/** Add/Edit asset dialog. Shared form for both create and update flows. */
export default function AssetFormDialog({ open, asset, onClose, onSubmit }: AssetFormDialogProps) {
  const [form, setForm] = useState<AssetInput>(emptyForm);
  const [tagInput, setTagInput] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Populate the form when opening in edit mode; reset for add mode
  useEffect(() => {
    if (!open) return;
    setError("");
    setTagInput("");
    if (asset) {
      setForm({
        name: asset.name,
        hostname: asset.hostname ?? "",
        ip_address: asset.ip_address ?? "",
        asset_type: asset.asset_type,
        operating_system: asset.operating_system ?? "",
        owner: asset.owner ?? "",
        department: asset.department ?? "",
        criticality: asset.criticality,
        status: asset.status,
        tags: asset.tags,
        description: asset.description ?? "",
        cvss_score: asset.cvss_score,
        internet_exposed: asset.internet_exposed,
        missing_mfa: asset.missing_mfa,
        weak_password: asset.weak_password,
        misconfigured: asset.misconfigured,
        open_ports: asset.open_ports,
        business_importance: asset.business_importance,
      });
    } else {
      setForm(emptyForm);
    }
  }, [open, asset]);

  const set = <K extends keyof AssetInput>(key: K, value: AssetInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) set("tags", [...form.tags, t]);
    setTagInput("");
  };

  const removeTag = (tag: string) =>
    set("tags", form.tags.filter((t) => t !== tag));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      // Convert empty strings to null so the backend stores real nulls
      const cleaned: AssetInput = {
        ...form,
        hostname: form.hostname?.trim() || null,
        ip_address: form.ip_address?.trim() || null,
        operating_system: form.operating_system?.trim() || null,
        owner: form.owner?.trim() || null,
        department: form.department?.trim() || null,
        description: form.description?.trim() || null,
      };
      await onSubmit(cleaned);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.detail?.toString() ?? "Failed to save asset.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} title={asset ? "Edit Asset" : "Add Asset"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Name *">
            <input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} required />
          </Field>
          <Field label="Asset Type">
            <select
              className="input"
              value={form.asset_type}
              onChange={(e) => set("asset_type", e.target.value as AssetType)}
            >
              {Object.entries(ASSET_TYPE_LABELS).map(([v, label]) => (
                <option key={v} value={v}>{label}</option>
              ))}
            </select>
          </Field>
          <Field label="Hostname">
            <input className="input" value={form.hostname ?? ""} onChange={(e) => set("hostname", e.target.value)} />
          </Field>
          <Field label="IP Address">
            <input className="input" value={form.ip_address ?? ""} onChange={(e) => set("ip_address", e.target.value)} placeholder="10.0.0.1" />
          </Field>
          <Field label="Operating System">
            <input className="input" value={form.operating_system ?? ""} onChange={(e) => set("operating_system", e.target.value)} />
          </Field>
          <Field label="Owner">
            <input className="input" value={form.owner ?? ""} onChange={(e) => set("owner", e.target.value)} />
          </Field>
          <Field label="Department">
            <input className="input" value={form.department ?? ""} onChange={(e) => set("department", e.target.value)} />
          </Field>
          <Field label="Criticality">
            <select
              className="input"
              value={form.criticality}
              onChange={(e) => set("criticality", e.target.value as Criticality)}
            >
              {Object.entries(CRITICALITY_LABELS).map(([v, label]) => (
                <option key={v} value={v}>{label}</option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select
              className="input"
              value={form.status}
              onChange={(e) => set("status", e.target.value as AssetStatus)}
            >
              {Object.entries(STATUS_LABELS).map(([v, label]) => (
                <option key={v} value={v}>{label}</option>
              ))}
            </select>
          </Field>
        </div>

        {/* Tags */}
        <Field label="Tags">
          <div className="flex gap-2">
            <input
              className="input"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder="Type a tag and press Enter"
            />
            <button type="button" onClick={addTag} className="btn-primary shrink-0">
              Add
            </button>
          </div>
          {form.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {form.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-1 rounded bg-surface-700 text-slate-300 flex items-center gap-1"
                >
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="text-slate-500 hover:text-severity-critical">
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </Field>

        {/* Risk factors — feed the Risk Scoring Engine */}
        <div className="border-t border-surface-700/60 pt-4">
          <p className="text-xs uppercase tracking-wider text-slate-500 mb-3">Risk Factors</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="CVSS Score (0–10)">
              <input
                type="number" min={0} max={10} step={0.1}
                className="input"
                value={form.cvss_score}
                onChange={(e) => set("cvss_score", Number(e.target.value))}
              />
            </Field>
            <Field label="Open Ports">
              <input
                type="number" min={0}
                className="input"
                value={form.open_ports}
                onChange={(e) => set("open_ports", Number(e.target.value))}
              />
            </Field>
            <Field label="Business Importance (1–5)">
              <input
                type="number" min={1} max={5}
                className="input"
                value={form.business_importance}
                onChange={(e) => set("business_importance", Number(e.target.value))}
              />
            </Field>
          </div>

          {/* Boolean risk flags */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
            <Checkbox label="Internet Exposed" checked={form.internet_exposed} onChange={(v) => set("internet_exposed", v)} />
            <Checkbox label="Missing MFA" checked={form.missing_mfa} onChange={(v) => set("missing_mfa", v)} />
            <Checkbox label="Weak Password" checked={form.weak_password} onChange={(v) => set("weak_password", v)} />
            <Checkbox label="Misconfigured" checked={form.misconfigured} onChange={(v) => set("misconfigured", v)} />
          </div>
        </div>

        <Field label="Description">
          <textarea
            className="input min-h-[80px] resize-y"
            value={form.description ?? ""}
            onChange={(e) => set("description", e.target.value)}
          />
        </Field>

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
            {saving ? "Saving…" : asset ? "Save Changes" : "Create Asset"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/** Small labeled field wrapper to keep the form markup tidy. */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-wider text-slate-500 mb-1.5">{label}</span>
      {children}
    </label>
  );
}

/** Styled checkbox for boolean risk flags. */
function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-surface-600 bg-surface-900 text-accent accent-accent"
      />
      {label}
    </label>
  );
}
