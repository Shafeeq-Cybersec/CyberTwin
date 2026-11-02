import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Server, ShieldAlert, Globe, UserX, Bug, Gauge } from "lucide-react";
import * as dashboardApi from "../api/dashboard";
import type { DashboardData } from "../types/dashboard";
import StatCard from "../components/ui/StatCard";
import ChartCard from "../components/charts/ChartCard";
import DonutChart from "../components/charts/DonutChart";
import BarList from "../components/charts/BarList";
import Badge from "../components/ui/Badge";
import { SEVERITY_LABELS, SEVERITY_STYLES } from "../types/vulnerability";
import type { Severity } from "../types/vulnerability";

// Risk-level colors for the distribution donut (order: Low→Critical)
const RISK_DIST_COLORS = ["#4ade80", "#facc15", "#fb923c", "#f43f5e"];

// A palette for categorical charts (asset types, OS)
const CATEGORY_COLORS = [
  "#22d3ee", "#a78bfa", "#38bdf8", "#34d399", "#facc15",
  "#fb923c", "#f43f5e", "#f472b6", "#60a5fa", "#4ade80",
];

// Map a 0–100 risk score to a level color (matches the Risk Engine bands)
function scoreColor(score: number): string {
  if (score >= 75) return "#f43f5e";
  if (score >= 50) return "#fb923c";
  if (score >= 25) return "#facc15";
  return "#4ade80";
}

/** Enterprise SOC dashboard — KPI cards + risk/asset/vuln charts. */
export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    dashboardApi
      .getDashboard()
      .then(setData)
      .catch(() => setError("Failed to load dashboard. Is the backend running?"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <p className="text-sm text-severity-critical bg-severity-critical/10 border border-severity-critical/20 rounded-lg px-3 py-2">
        {error || "No data."}
      </p>
    );
  }

  const { kpis } = data;

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
        <StatCard title="Total Assets" value={String(kpis.total_assets)} icon={Server} />
        <StatCard title="Critical Assets" value={String(kpis.critical_assets)} icon={ShieldAlert} accentClass="text-severity-critical" />
        <StatCard title="Internet Facing" value={String(kpis.internet_facing_assets)} icon={Globe} accentClass="text-severity-high" />
        <StatCard title="High Risk Users" value={String(kpis.high_risk_users)} icon={UserX} accentClass="text-severity-high" />
        <StatCard title="Critical CVEs" value={String(kpis.critical_cves)} icon={Bug} accentClass="text-severity-critical" />
        <StatCard title="Avg Risk Score" value={String(kpis.average_risk_score)} icon={Gauge} accentClass={scoreColorClass(kpis.average_risk_score)} />
      </div>

      {/* Row 1: risk distribution + asset types */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Risk Distribution" subtitle="Assets by computed risk level">
          <DonutChart
            centerValue={kpis.total_assets}
            centerLabel="Total assets"
            data={data.risk_distribution.map((d, i) => ({
              label: d.label,
              value: d.value,
              color: RISK_DIST_COLORS[i] ?? "#64748b",
            }))}
          />
        </ChartCard>

        <ChartCard title="Asset Types" subtitle="Inventory breakdown by type">
          <BarList
            items={data.asset_types.map((d, i) => ({
              label: d.label,
              value: d.value,
              color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
            }))}
          />
        </ChartCard>
      </div>

      {/* Row 2: department risk + operating systems */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Department Risk" subtitle="Average risk score per department">
          <BarList
            items={data.department_risk.map((d) => ({
              label: d.department,
              value: d.average_risk,
              color: scoreColor(d.average_risk),
              suffix: `${d.average_risk} · ${d.asset_count} asset${d.asset_count === 1 ? "" : "s"}`,
            }))}
          />
        </ChartCard>

        <ChartCard title="Operating Systems" subtitle="Assets by OS">
          <BarList
            items={data.operating_systems.map((d, i) => ({
              label: d.label,
              value: d.value,
              color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
            }))}
          />
        </ChartCard>
      </div>

      {/* Row 3: top vulnerabilities */}
      <ChartCard title="Top Vulnerabilities" subtitle="Highest CVSS across the environment">
        {data.top_vulnerabilities.length === 0 ? (
          <p className="text-sm text-slate-500 py-6 text-center">No vulnerabilities recorded yet.</p>
        ) : (
          <ul className="divide-y divide-surface-700/40">
            {data.top_vulnerabilities.map((v) => (
              <li key={v.id} className="flex items-center gap-4 py-3">
                <Badge className={SEVERITY_STYLES[v.severity as Severity]}>{SEVERITY_LABELS[v.severity as Severity]}</Badge>
                <Link to={`/vulnerabilities/${v.id}`} className="font-mono text-xs text-accent hover:underline shrink-0">
                  {v.cve_id}
                </Link>
                <span className="text-sm text-slate-300 truncate flex-1">{v.title || "—"}</span>
                <span className="text-xs text-slate-500 tabular-nums shrink-0">{v.affected_assets} asset{v.affected_assets === 1 ? "" : "s"}</span>
                {/* CVSS gauge bar */}
                <div className="hidden sm:flex items-center gap-2 w-32 shrink-0">
                  <div className="h-1.5 flex-1 rounded-full bg-surface-900 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(v.cvss / 10) * 100}%`, backgroundColor: scoreColor(v.cvss * 10) }} />
                  </div>
                  <span className="text-xs text-slate-400 tabular-nums w-7 text-right">{v.cvss.toFixed(1)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </ChartCard>
    </div>
  );
}

/** Tailwind text-color class for the average-risk KPI icon. */
function scoreColorClass(score: number): string {
  if (score >= 75) return "text-severity-critical";
  if (score >= 50) return "text-severity-high";
  if (score >= 25) return "text-severity-medium";
  return "text-severity-low";
}
