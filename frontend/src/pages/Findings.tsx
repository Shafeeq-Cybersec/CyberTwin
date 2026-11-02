import { useCallback, useEffect, useState } from "react";
import { Plus, Search, Sparkles, ShieldAlert, ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";
import * as findingsApi from "../api/findings";
import type {
  Finding,
  FindingInput,
  FindingQuery,
  FindingStats,
  FindingType,
  Severity,
  VulnStatus,
} from "../types/finding";
import {
  FINDING_TYPE_LABELS,
  SEVERITY_LABELS,
  SEVERITY_STYLES,
  FINDING_STATUS_LABELS,
  FINDING_STATUS_STYLES,
} from "../types/finding";
import Badge from "../components/ui/Badge";
import ConfirmDialog from "../components/assets/ConfirmDialog";
import FindingFormDialog from "../components/findings/FindingFormDialog";
import FindingDetailModal from "../components/findings/FindingDetailModal";

const PAGE_SIZE = 10;

// Colored severity summary tiles (order matters — most severe first)
const SEVERITY_ORDER: Severity[] = ["critical", "high", "medium", "low", "info"];

function useDebounced<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

/** Security Findings dashboard — stats, generation, filters, and triage. */
export default function Findings() {
  const [query, setQuery] = useState<FindingQuery>({ sort_order: "desc", page: 1, page_size: PAGE_SIZE });
  const debouncedSearch = useDebounced(query.search ?? "");

  const [findings, setFindings] = useState<Finding[]>([]);
  const [stats, setStats] = useState<FindingStats | null>(null);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [generating, setGenerating] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Finding | null>(null);
  const [viewing, setViewing] = useState<Finding | null>(null);
  const [deleting, setDeleting] = useState<Finding | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [page, s] = await Promise.all([
        findingsApi.listFindings({ ...query, search: debouncedSearch }),
        findingsApi.getStats(),
      ]);
      setFindings(page.items);
      setTotal(page.total);
      setPages(page.pages);
      setStats(s);
    } catch {
      setError("Failed to load findings. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }, [query, debouncedSearch]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const patchQuery = (patch: Partial<FindingQuery>) =>
    setQuery((q) => ({ ...q, ...patch, page: "page" in patch ? patch.page! : 1 }));

  const handleGenerate = async () => {
    setGenerating(true);
    setToast("");
    try {
      const res = await findingsApi.generateFindings();
      setToast(res.message);
      await fetchAll();
    } catch {
      setError("Generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  const handleCreate = async (input: FindingInput) => {
    await findingsApi.createFinding(input);
    await fetchAll();
  };
  const handleUpdate = async (input: FindingInput) => {
    if (!editing) return;
    await findingsApi.updateFinding(editing.id, input);
    await fetchAll();
  };
  const handleDelete = async () => {
    if (!deleting) return;
    await findingsApi.deleteFinding(deleting.id);
    setDeleting(null);
    await fetchAll();
  };

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (f: Finding) => {
    setViewing(null);
    setEditing(f);
    setFormOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Security Findings</h2>
          <p className="text-sm text-slate-500">{total} findings · {stats?.open ?? 0} open</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={handleGenerate} disabled={generating} className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-surface-800 border border-surface-600/50 text-slate-300 hover:bg-surface-700 disabled:opacity-50">
            <Sparkles className="w-4 h-4 text-accent" /> {generating ? "Generating…" : "Generate"}
          </button>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Finding
          </button>
        </div>
      </div>

      {toast && (
        <p className="text-sm text-accent bg-accent/10 border border-accent/20 rounded-lg px-3 py-2">{toast}</p>
      )}

      {/* Severity summary tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <SummaryTile label="Total" value={stats?.total ?? 0} icon />
        {SEVERITY_ORDER.map((sev) => (
          <SummaryTile
            key={sev}
            label={SEVERITY_LABELS[sev]}
            value={stats?.by_severity?.[sev] ?? 0}
            styleClass={SEVERITY_STYLES[sev]}
          />
        ))}
      </div>

      {/* Search + filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex items-center gap-2 bg-surface-800 border border-surface-600/50 rounded-lg px-3 py-2 flex-1 min-w-0">
          <Search className="w-4 h-4 text-slate-500 shrink-0" />
          <input
            className="bg-transparent outline-none text-sm w-full placeholder-slate-500"
            placeholder="Search by title, description, or technique id…"
            value={query.search ?? ""}
            onChange={(e) => patchQuery({ search: e.target.value })}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select className="input w-auto py-2" value={query.finding_type ?? ""} onChange={(e) => patchQuery({ finding_type: (e.target.value || undefined) as FindingType | undefined })}>
            <option value="">All Types</option>
            {Object.entries(FINDING_TYPE_LABELS).map(([v, label]) => (
              <option key={v} value={v}>{label}</option>
            ))}
          </select>
          <select className="input w-auto py-2" value={query.severity ?? ""} onChange={(e) => patchQuery({ severity: (e.target.value || undefined) as Severity | undefined })}>
            <option value="">All Severity</option>
            {Object.entries(SEVERITY_LABELS).map(([v, label]) => (
              <option key={v} value={v}>{label}</option>
            ))}
          </select>
          <select className="input w-auto py-2" value={query.status ?? ""} onChange={(e) => patchQuery({ status: (e.target.value || undefined) as VulnStatus | undefined })}>
            <option value="">All Status</option>
            {Object.entries(FINDING_STATUS_LABELS).map(([v, label]) => (
              <option key={v} value={v}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p className="text-sm text-severity-critical bg-severity-critical/10 border border-severity-critical/20 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : findings.length === 0 ? (
          <div className="text-center py-20 text-slate-400 text-sm">
            No findings yet. Click <span className="text-accent">Generate</span> to detect them from asset risk factors, or add one manually.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-surface-700/60">
                  <th className="px-4 py-3 font-medium">Severity</th>
                  <th className="px-4 py-3 font-medium">Finding</th>
                  <th className="px-4 py-3 font-medium">Asset</th>
                  <th className="px-4 py-3 font-medium">MITRE</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-700/40">
                {findings.map((f) => (
                  <tr key={f.id} onClick={() => setViewing(f)} className="hover:bg-surface-700/30 cursor-pointer transition-colors">
                    <td className="px-4 py-3">
                      <Badge className={SEVERITY_STYLES[f.severity]}>{SEVERITY_LABELS[f.severity]}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-200">{f.title}</div>
                      <div className="text-xs text-slate-500">{FINDING_TYPE_LABELS[f.finding_type]}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{f.asset.name}</td>
                    <td className="px-4 py-3">
                      {f.mitre_technique_id ? (
                        <span className="font-mono text-xs text-accent">{f.mitre_technique_id}</span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={FINDING_STATUS_STYLES[f.status]}>{FINDING_STATUS_LABELS[f.status]}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => openEdit(f)} className="p-1.5 rounded-lg hover:bg-surface-600 text-slate-400 hover:text-accent" title="Edit">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleting(f)} className="p-1.5 rounded-lg hover:bg-surface-600 text-slate-400 hover:text-severity-critical" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Page {query.page} of {pages}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => patchQuery({ page: query.page! - 1 })} disabled={query.page! <= 1} className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-surface-800 border border-surface-600/50 text-slate-300 hover:bg-surface-700 disabled:opacity-40 disabled:cursor-not-allowed">
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <button onClick={() => patchQuery({ page: query.page! + 1 })} disabled={query.page! >= pages} className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-surface-800 border border-surface-600/50 text-slate-300 hover:bg-surface-700 disabled:opacity-40 disabled:cursor-not-allowed">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Detail modal */}
      <FindingDetailModal finding={viewing} onClose={() => setViewing(null)} onEdit={openEdit} onDelete={setDeleting} />

      {/* Add / Edit dialog */}
      <FindingFormDialog open={formOpen} finding={editing} onClose={() => setFormOpen(false)} onSubmit={editing ? handleUpdate : handleCreate} />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleting}
        title="Delete Finding"
        message={`Delete "${deleting?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}

/** A compact summary tile for the dashboard header. */
function SummaryTile({ label, value, styleClass, icon }: { label: string; value: number; styleClass?: string; icon?: boolean }) {
  return (
    <div className={`card py-3 px-4 ${styleClass ? "" : ""}`}>
      <div className="flex items-center gap-2">
        {icon && <ShieldAlert className="w-4 h-4 text-accent" />}
        <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
      </div>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${styleClass ? styleClass.split(" ")[0] : "text-slate-100"}`}>
        {value}
      </p>
    </div>
  );
}
