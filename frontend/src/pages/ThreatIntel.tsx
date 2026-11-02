import { useCallback, useEffect, useState } from "react";
import { Download, Link2, Search, ShieldAlert, ExternalLink } from "lucide-react";
import * as threatApi from "../api/threatIntel";
import type {
  ThreatIntel,
  ThreatSource,
  ThreatStats,
} from "../types/threatIntel";
import {
  THREAT_SOURCE_LABELS,
  THREAT_SOURCE_STYLES,
} from "../types/threatIntel";
import { SEVERITY_LABELS, SEVERITY_STYLES } from "../types/vulnerability";
import type { Severity } from "../types/vulnerability";
import Badge from "../components/ui/Badge";

const SOURCES: ThreatSource[] = ["mitre_attack", "cve", "cisa_kev", "capec"];

/** Threat Intelligence — import feeds, correlate to assets, browse entries. */
export default function ThreatIntel() {
  const [threats, setThreats] = useState<ThreatIntel[]>([]);
  const [stats, setStats] = useState<ThreatStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"import" | "correlate" | null>(null);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<ThreatSource | "">("");
  const [kevOnly, setKevOnly] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [rows, s] = await Promise.all([
        threatApi.listThreats({
          source: sourceFilter || undefined,
          kev_only: kevOnly,
          search: search || undefined,
        }),
        threatApi.getStats(),
      ]);
      setThreats(rows);
      setStats(s);
    } catch {
      setError("Failed to load threat intelligence. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }, [sourceFilter, kevOnly, search]);

  useEffect(() => {
    const id = setTimeout(fetchAll, 250);
    return () => clearTimeout(id);
  }, [fetchAll]);

  const handleImport = async () => {
    setBusy("import");
    setToast("");
    try {
      const res = await threatApi.importFeeds();
      setToast(res.message);
      await fetchAll();
    } catch {
      setError("Import failed.");
    } finally {
      setBusy(null);
    }
  };

  const handleCorrelate = async () => {
    setBusy("correlate");
    setToast("");
    try {
      const res = await threatApi.correlate();
      setToast(res.message);
      await fetchAll();
    } catch {
      setError("Correlation failed.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Threat Intelligence</h2>
          <p className="text-sm text-slate-500">{stats?.total ?? 0} entries · {stats?.kev_count ?? 0} known-exploited</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={handleImport} disabled={busy !== null} className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-surface-800 border border-surface-600/50 text-slate-300 hover:bg-surface-700 disabled:opacity-50">
            <Download className="w-4 h-4 text-accent" /> {busy === "import" ? "Importing…" : "Import Feeds"}
          </button>
          <button onClick={handleCorrelate} disabled={busy !== null} className="btn-primary flex items-center gap-2">
            <Link2 className="w-4 h-4" /> {busy === "correlate" ? "Correlating…" : "Correlate to Assets"}
          </button>
        </div>
      </div>

      {toast && <p className="text-sm text-accent bg-accent/10 border border-accent/20 rounded-lg px-3 py-2">{toast}</p>}
      {error && <p className="text-sm text-severity-critical bg-severity-critical/10 border border-severity-critical/20 rounded-lg px-3 py-2">{error}</p>}

      {/* Source tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {SOURCES.map((src) => (
          <div key={src} className="card py-3 px-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">{THREAT_SOURCE_LABELS[src]}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-100">{stats?.by_source?.[src] ?? 0}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex items-center gap-2 bg-surface-800 border border-surface-600/50 rounded-lg px-3 py-2 flex-1 min-w-0">
          <Search className="w-4 h-4 text-slate-500 shrink-0" />
          <input
            className="bg-transparent outline-none text-sm w-full placeholder-slate-500"
            placeholder="Search by ID or title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <select className="input w-auto py-2" value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value as ThreatSource | "")}>
            <option value="">All Sources</option>
            {SOURCES.map((src) => (
              <option key={src} value={src}>{THREAT_SOURCE_LABELS[src]}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer select-none px-3 py-2 rounded-lg bg-surface-800 border border-surface-600/50">
            <input type="checkbox" checked={kevOnly} onChange={(e) => setKevOnly(e.target.checked)} className="w-4 h-4 accent-severity-critical" />
            KEV only
          </label>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : threats.length === 0 ? (
          <div className="text-center py-20 text-slate-400 text-sm">
            No threat data yet. Click <span className="text-accent">Import Feeds</span> to pull from MITRE ATT&CK, CVE, CISA KEV, and CAPEC.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-surface-700/60">
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">ID</th>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Severity</th>
                  <th className="px-4 py-3 font-medium">CVSS</th>
                  <th className="px-4 py-3 font-medium">MITRE</th>
                  <th className="px-4 py-3 font-medium text-right">Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-700/40">
                {threats.map((t) => (
                  <tr key={t.id} className="hover:bg-surface-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <Badge className={THREAT_SOURCE_STYLES[t.source]}>{THREAT_SOURCE_LABELS[t.source]}</Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-accent whitespace-nowrap">
                      {t.external_id}
                      {t.kev && (
                        <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-severity-critical" title="CISA Known Exploited">
                          <ShieldAlert className="w-3 h-3" /> KEV
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-200 max-w-md truncate">{t.title}</td>
                    <td className="px-4 py-3">
                      {t.severity ? (
                        <Badge className={SEVERITY_STYLES[t.severity as Severity]}>{SEVERITY_LABELS[t.severity as Severity]}</Badge>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-slate-300">{t.cvss != null ? t.cvss.toFixed(1) : "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{t.mitre_technique_id || t.capec_id || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      {t.references[0] ? (
                        <a href={t.references[0]} target="_blank" rel="noreferrer" className="inline-flex text-slate-400 hover:text-accent" title="Open reference">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
