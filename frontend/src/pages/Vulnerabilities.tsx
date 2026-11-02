import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";
import * as vulnApi from "../api/vulnerabilities";
import type {
  Severity,
  Vulnerability,
  VulnerabilityInput,
  VulnerabilityQuery,
  VulnStatus,
} from "../types/vulnerability";
import {
  SEVERITY_LABELS,
  SEVERITY_STYLES,
  VULN_STATUS_LABELS,
  VULN_STATUS_STYLES,
} from "../types/vulnerability";
import Badge from "../components/ui/Badge";
import ConfirmDialog from "../components/assets/ConfirmDialog";
import VulnerabilityFormDialog from "../components/vulnerabilities/VulnerabilityFormDialog";

const PAGE_SIZE = 10;

function useDebounced<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

/** Vulnerabilities page — CVE tracking with search, filters, and CRUD. */
export default function Vulnerabilities() {
  const navigate = useNavigate();
  const [query, setQuery] = useState<VulnerabilityQuery>({
    sort_order: "desc",
    page: 1,
    page_size: PAGE_SIZE,
  });
  const debouncedSearch = useDebounced(query.search ?? "");

  const [vulns, setVulns] = useState<Vulnerability[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Vulnerability | null>(null);
  const [deleting, setDeleting] = useState<Vulnerability | null>(null);

  const fetchVulns = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await vulnApi.listVulnerabilities({ ...query, search: debouncedSearch });
      setVulns(data.items);
      setTotal(data.total);
      setPages(data.pages);
    } catch {
      setError("Failed to load vulnerabilities. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }, [query, debouncedSearch]);

  useEffect(() => {
    fetchVulns();
  }, [fetchVulns]);

  const patchQuery = (patch: Partial<VulnerabilityQuery>) =>
    setQuery((q) => ({ ...q, ...patch, page: "page" in patch ? patch.page! : 1 }));

  const handleCreate = async (input: VulnerabilityInput) => {
    await vulnApi.createVulnerability(input);
    await fetchVulns();
  };
  const handleUpdate = async (input: VulnerabilityInput) => {
    if (!editing) return;
    await vulnApi.updateVulnerability(editing.id, input);
    await fetchVulns();
  };
  const handleDelete = async () => {
    if (!deleting) return;
    await vulnApi.deleteVulnerability(deleting.id);
    setDeleting(null);
    await fetchVulns();
  };

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (v: Vulnerability) => {
    setEditing(v);
    setFormOpen(true);
  };

  const rangeLabel = useMemo(() => {
    if (total === 0) return "0 vulnerabilities";
    const start = (query.page! - 1) * PAGE_SIZE + 1;
    const end = Math.min(query.page! * PAGE_SIZE, total);
    return `${start}–${end} of ${total} vulnerabilities`;
  }, [query.page, total]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Vulnerabilities</h2>
          <p className="text-sm text-slate-500">{rangeLabel}</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 shrink-0">
          <Plus className="w-4 h-4" /> Add Vulnerability
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex items-center gap-2 bg-surface-800 border border-surface-600/50 rounded-lg px-3 py-2 flex-1 min-w-0">
          <Search className="w-4 h-4 text-slate-500 shrink-0" />
          <input
            className="bg-transparent outline-none text-sm w-full placeholder-slate-500"
            placeholder="Search by CVE, title, or description…"
            value={query.search ?? ""}
            onChange={(e) => patchQuery({ search: e.target.value })}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            className="input w-auto py-2"
            value={query.severity ?? ""}
            onChange={(e) => patchQuery({ severity: (e.target.value || undefined) as Severity | undefined })}
          >
            <option value="">All Severity</option>
            {Object.entries(SEVERITY_LABELS).map(([v, label]) => (
              <option key={v} value={v}>{label}</option>
            ))}
          </select>
          <select
            className="input w-auto py-2"
            value={query.status ?? ""}
            onChange={(e) => patchQuery({ status: (e.target.value || undefined) as VulnStatus | undefined })}
          >
            <option value="">All Status</option>
            {Object.entries(VULN_STATUS_LABELS).map(([v, label]) => (
              <option key={v} value={v}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p className="text-sm text-severity-critical bg-severity-critical/10 border border-severity-critical/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : vulns.length === 0 ? (
          <div className="text-center py-20 text-slate-400 text-sm">No vulnerabilities match your filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-surface-700/60">
                  <th className="px-4 py-3 font-medium">CVE</th>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Severity</th>
                  <th className="px-4 py-3 font-medium">CVSS</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Assets</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-700/40">
                {vulns.map((v) => (
                  <tr
                    key={v.id}
                    onClick={() => navigate(`/vulnerabilities/${v.id}`)}
                    className="hover:bg-surface-700/30 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-accent">{v.cve_id}</td>
                    <td className="px-4 py-3 text-slate-200 max-w-xs truncate">{v.title || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge className={SEVERITY_STYLES[v.severity]}>{SEVERITY_LABELS[v.severity]}</Badge>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-slate-300">{v.cvss.toFixed(1)}</td>
                    <td className="px-4 py-3">
                      <Badge className={VULN_STATUS_STYLES[v.status]}>{VULN_STATUS_LABELS[v.status]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{v.affected_assets.length}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => openEdit(v)} className="p-1.5 rounded-lg hover:bg-surface-600 text-slate-400 hover:text-accent" title="Edit">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleting(v)} className="p-1.5 rounded-lg hover:bg-surface-600 text-slate-400 hover:text-severity-critical" title="Delete">
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

      <VulnerabilityFormDialog
        open={formOpen}
        vulnerability={editing}
        onClose={() => setFormOpen(false)}
        onSubmit={editing ? handleUpdate : handleCreate}
      />
      <ConfirmDialog
        open={!!deleting}
        title="Delete Vulnerability"
        message={`Delete "${deleting?.cve_id}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
