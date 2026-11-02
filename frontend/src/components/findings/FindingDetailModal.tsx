import { Link } from "react-router-dom";
import { Pencil, Trash2, ExternalLink, Target } from "lucide-react";
import Modal from "../ui/Modal";
import Badge from "../ui/Badge";
import type { Finding } from "../../types/finding";
import {
  FINDING_TYPE_LABELS,
  SEVERITY_LABELS,
  SEVERITY_STYLES,
  FINDING_STATUS_LABELS,
  FINDING_STATUS_STYLES,
} from "../../types/finding";
import { ASSET_TYPE_LABELS } from "../../types/asset";

interface FindingDetailModalProps {
  finding: Finding | null;
  onClose: () => void;
  onEdit: (f: Finding) => void;
  onDelete: (f: Finding) => void;
}

/** Read-only finding detail with prominent MITRE ATT&CK mapping. */
export default function FindingDetailModal({ finding, onClose, onEdit, onDelete }: FindingDetailModalProps) {
  if (!finding) return null;

  return (
    <Modal open={!!finding} title={FINDING_TYPE_LABELS[finding.finding_type]} onClose={onClose}>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-100">{finding.title}</h3>
          <div className="flex flex-wrap gap-2">
            <Badge className={SEVERITY_STYLES[finding.severity]}>{SEVERITY_LABELS[finding.severity]}</Badge>
            <Badge className={FINDING_STATUS_STYLES[finding.status]}>{FINDING_STATUS_LABELS[finding.status]}</Badge>
          </div>
        </div>

        {/* Affected asset */}
        <div className="flex items-center justify-between bg-surface-900 rounded-lg px-3 py-2.5">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">Affected Asset</p>
            <p className="text-sm text-slate-200 mt-0.5">
              {finding.asset.name} <span className="text-slate-500">· {ASSET_TYPE_LABELS[finding.asset.asset_type]}</span>
            </p>
          </div>
          <Link to={`/assets/${finding.asset_id}`} onClick={onClose} className="text-accent hover:text-accent-glow p-1.5" title="Open asset">
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>

        {/* MITRE ATT&CK */}
        {(finding.mitre_technique_id || finding.mitre_tactic) && (
          <div className="rounded-lg border border-accent/20 bg-accent/5 px-3 py-3">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-accent" />
              <span className="text-xs uppercase tracking-wider text-accent font-medium">MITRE ATT&CK</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-xs text-slate-500">Tactic</p>
                <p className="text-slate-200">{finding.mitre_tactic || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Technique</p>
                <p className="font-mono text-accent">{finding.mitre_technique_id || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Name</p>
                <p className="text-slate-200">{finding.mitre_technique_name || "—"}</p>
              </div>
            </div>
          </div>
        )}

        {/* Description + recommendation */}
        <section>
          <h4 className="text-xs uppercase tracking-wider text-slate-500 mb-1.5">Description</h4>
          <p className="text-sm text-slate-300 whitespace-pre-wrap">{finding.description || "No description provided."}</p>
        </section>
        <section>
          <h4 className="text-xs uppercase tracking-wider text-slate-500 mb-1.5">Recommendation</h4>
          <p className="text-sm text-slate-300 whitespace-pre-wrap">{finding.recommendation || "No recommendation provided."}</p>
        </section>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-surface-700/60">
          <button onClick={() => onDelete(finding)} className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-severity-critical/10 border border-severity-critical/20 text-severity-critical hover:bg-severity-critical/20">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
          <button onClick={() => onEdit(finding)} className="btn-primary flex items-center gap-2">
            <Pencil className="w-4 h-4" /> Edit
          </button>
        </div>
      </div>
    </Modal>
  );
}
