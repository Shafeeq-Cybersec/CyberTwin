import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import * as assetsApi from "../api/assets";
import * as vulnApi from "../api/vulnerabilities";
import * as threatApi from "../api/threatIntel";
import type { Asset, AssetInput } from "../types/asset";
import type { Vulnerability } from "../types/vulnerability";
import type { AssetThreatMatch } from "../types/threatIntel";
import { THREAT_SOURCE_LABELS, THREAT_SOURCE_STYLES } from "../types/threatIntel";
import { SEVERITY_LABELS, SEVERITY_STYLES } from "../types/vulnerability";
import {
  ASSET_TYPE_LABELS,
  CRITICALITY_LABELS,
  CRITICALITY_STYLES,
  STATUS_LABELS,
  STATUS_STYLES,
} from "../types/asset";
import Badge from "../components/ui/Badge";
import RiskBadge from "../components/ui/RiskBadge";
import RiskExplanation from "../components/ui/RiskExplanation";
import AssetFormDialog from "../components/assets/AssetFormDialog";
import ConfirmDialog from "../components/assets/ConfirmDialog";

/** Full detail view for a single asset, with edit/delete actions. */
export default function AssetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [asset, setAsset] = useState<Asset | null>(null);
  const [vulns, setVulns] = useState<Vulnerability[]>([]);
  const [threats, setThreats] = useState<AssetThreatMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const fetchAsset = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      setAsset(await assetsApi.getAsset(id));
      // Vulnerabilities affecting this asset (integration with Findings)
      vulnApi
        .listVulnerabilities({ asset_id: id, page_size: 100 })
        .then((p) => setVulns(p.items))
        .catch(() => setVulns([]));
      // Correlated threat intelligence for this asset
      threatApi.matchesForAsset(id).then(setThreats).catch(() => setThreats([]));
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAsset();
  }, [fetchAsset]);

  const handleUpdate = async (input: AssetInput) => {
    if (!id) return;
    setAsset(await assetsApi.updateAsset(id, input));
  };

  const handleDelete = async () => {
    if (!id) return;
    await assetsApi.deleteAsset(id);
    navigate("/assets");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !asset) {
    return (
      <div className="card text-center py-20">
        <p className="text-slate-300">Asset not found.</p>
        <button onClick={() => navigate("/assets")} className="btn-primary mt-4 inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Inventory
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Back link + actions */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate("/assets")} className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200">
          <ArrowLeft className="w-4 h-4" /> Back to Inventory
        </button>
        <div className="flex gap-2">
          <button onClick={() => setEditOpen(true)} className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-surface-800 border border-surface-600/50 text-slate-300 hover:bg-surface-700">
            <Pencil className="w-4 h-4" /> Edit
          </button>
          <button onClick={() => setDeleteOpen(true)} className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-severity-critical/10 border border-severity-critical/20 text-severity-critical hover:bg-severity-critical/20">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      {/* Header card */}
      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-100">{asset.name}</h1>
            <p className="text-sm text-slate-500 mt-1">{ASSET_TYPE_LABELS[asset.asset_type]}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <RiskBadge score={asset.risk.score} level={asset.risk.level} />
            <Badge className={CRITICALITY_STYLES[asset.criticality]}>{CRITICALITY_LABELS[asset.criticality]}</Badge>
            <Badge className={STATUS_STYLES[asset.status]}>{STATUS_LABELS[asset.status]}</Badge>
          </div>
        </div>

        {/* Attribute grid */}
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 mt-6">
          <Detail label="Hostname" value={asset.hostname} mono />
          <Detail label="IP Address" value={asset.ip_address} mono />
          <Detail label="Operating System" value={asset.operating_system} />
          <Detail label="Owner" value={asset.owner} />
          <Detail label="Department" value={asset.department} />
          <Detail label="Asset ID" value={asset.id} mono />
          <Detail label="Created" value={new Date(asset.created_at).toLocaleString()} />
          <Detail label="Last Updated" value={new Date(asset.updated_at).toLocaleString()} />
        </dl>

        {/* Tags */}
        <div className="mt-6">
          <dt className="text-xs uppercase tracking-wider text-slate-500 mb-2">Tags</dt>
          {asset.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {asset.tags.map((tag) => (
                <span key={tag} className="text-xs px-2 py-1 rounded bg-surface-700 text-slate-300">{tag}</span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No tags</p>
          )}
        </div>

        {/* Description */}
        <div className="mt-6">
          <dt className="text-xs uppercase tracking-wider text-slate-500 mb-2">Description</dt>
          <p className="text-sm text-slate-300 whitespace-pre-wrap">
            {asset.description || "No description provided."}
          </p>
        </div>
      </div>

      {/* Risk breakdown */}
      <div className="card">
        <h3 className="text-sm font-semibold text-slate-100 mb-4">Risk Assessment</h3>
        <RiskExplanation risk={asset.risk} />
      </div>

      {/* Linked vulnerabilities */}
      <div className="card">
        <h3 className="text-sm font-semibold text-slate-100 mb-4">
          Vulnerabilities <span className="text-slate-500 font-normal">({vulns.length})</span>
        </h3>
        {vulns.length === 0 ? (
          <p className="text-sm text-slate-500">No vulnerabilities linked to this asset.</p>
        ) : (
          <ul className="divide-y divide-surface-700/40">
            {vulns.map((v) => (
              <li key={v.id} className="flex items-center gap-4 py-2.5">
                <Badge className={SEVERITY_STYLES[v.severity]}>{SEVERITY_LABELS[v.severity]}</Badge>
                <Link to={`/vulnerabilities/${v.id}`} className="font-mono text-xs text-accent hover:underline shrink-0">
                  {v.cve_id}
                </Link>
                <span className="text-sm text-slate-300 truncate flex-1">{v.title || "—"}</span>
                <span className="text-xs text-slate-500 tabular-nums shrink-0">CVSS {v.cvss.toFixed(1)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Correlated threat intelligence */}
      {threats.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-100 mb-4">
            Threat Intelligence <span className="text-slate-500 font-normal">({threats.length})</span>
          </h3>
          <ul className="divide-y divide-surface-700/40">
            {threats.map((m) => (
              <li key={m.threat.id} className="flex items-center gap-3 py-2.5">
                <Badge className={THREAT_SOURCE_STYLES[m.threat.source]}>{THREAT_SOURCE_LABELS[m.threat.source]}</Badge>
                <span className="font-mono text-xs text-accent shrink-0">{m.threat.external_id}</span>
                <span className="text-sm text-slate-300 truncate flex-1">{m.threat.title}</span>
                {m.threat.kev && <span className="text-[10px] text-severity-critical shrink-0">KEV</span>}
              </li>
            ))}
          </ul>
          <p className="text-xs text-slate-500 mt-3">
            Correlated via matching CVEs. Threat correlation raises this asset's CVSS and risk score.
          </p>
        </div>
      )}

      <AssetFormDialog open={editOpen} asset={asset} onClose={() => setEditOpen(false)} onSubmit={handleUpdate} />
      <ConfirmDialog
        open={deleteOpen}
        title="Delete Asset"
        message={`Delete "${asset.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onClose={() => setDeleteOpen(false)}
      />
    </div>
  );
}

/** One label/value pair in the attribute grid. */
function Detail({ label, value, mono = false }: { label: string; value: string | null; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className={`mt-1 text-sm text-slate-200 ${mono ? "font-mono break-all" : ""}`}>{value || "—"}</dd>
    </div>
  );
}
