import { useState } from "react";
import {
  FileText,
  Download,
  ShieldCheck,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Printer,
} from "lucide-react";
import Badge from "../components/ui/Badge";

interface ReportTemplate {
  id: string;
  title: string;
  category: "Executive" | "Technical" | "Compliance";
  description: string;
  frequency: string;
  format: "PDF" | "CSV" | "JSON";
  lastGenerated: string;
  status: "Ready" | "Generating";
}

const TEMPLATES: ReportTemplate[] = [
  {
    id: "rep-01",
    title: "Executive Cyber Risk & Exposure Briefing",
    category: "Executive",
    description: "C-level summary of organizational risk score, critical crown jewel exposure, and board-ready risk metrics.",
    frequency: "Monthly",
    format: "PDF",
    lastGenerated: "Today, 09:30 AM",
    status: "Ready",
  },
  {
    id: "rep-02",
    title: "Attack Path & Lateral Movement Analysis",
    category: "Technical",
    description: "Detailed graph traversal paths from perimeter ingress points down to sensitive database clusters and identity hubs.",
    frequency: "On-demand",
    format: "PDF",
    lastGenerated: "Yesterday, 16:45 PM",
    status: "Ready",
  },
  {
    id: "rep-03",
    title: "NIST CSF 2.0 & ISO 27001 Compliance Audit",
    category: "Compliance",
    description: "Mapping of asset hardening controls, MFA posture, and open port hygiene against NIST Protect/Detect standards.",
    frequency: "Quarterly",
    format: "PDF",
    lastGenerated: "3 days ago",
    status: "Ready",
  },
  {
    id: "rep-04",
    title: "Active CVE Vulnerabilities & Remediation SLA",
    category: "Technical",
    description: "Full vulnerability log with CVSS v3.1/v4 scores, EPSS exploitation probability, and ticket remediation deadlines.",
    frequency: "Weekly",
    format: "CSV",
    lastGenerated: "4 hours ago",
    status: "Ready",
  },
];

export default function Reports() {
  const [reports] = useState<ReportTemplate[]>(TEMPLATES);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  const handleDownload = (rep: ReportTemplate) => {
    setDownloadingId(rep.id);
    setTimeout(() => {
      // Simulate file download
      const content = `=== ${rep.title} ===\nCategory: ${rep.category}\nFormat: ${rep.format}\nGenerated At: ${new Date().toISOString()}\nPlatform: CyberTwin SOC Platform\nSummary: Security posture evaluation and compliance certification.\nStatus: PASS\n`;
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${rep.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}.${rep.format.toLowerCase()}`;
      a.click();
      URL.revokeObjectURL(url);
      setDownloadingId(null);
      setSuccessMsg(`Successfully exported "${rep.title}" (${rep.format})`);
      setTimeout(() => setSuccessMsg(""), 4000);
    }, 1000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-accent" /> Security Reports & Executive Audits
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Export board-ready executive summaries, compliance audits, and attack graph telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handlePrint} className="btn-secondary flex items-center gap-2 text-xs">
            <Printer className="w-4 h-4" /> Print View
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 rounded-xl bg-severity-low/10 border border-severity-low/20 text-severity-low text-sm flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Quick KPI stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/20 text-accent">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 uppercase tracking-wider block">Audited Assets</span>
            <span className="text-xl font-bold text-slate-100 font-mono">100% (6/6)</span>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-severity-low/10 border border-severity-low/20 text-severity-low">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 uppercase tracking-wider block">Compliance Health</span>
            <span className="text-xl font-bold text-slate-100 font-mono">92.4%</span>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-surface-700 text-slate-300">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 uppercase tracking-wider block">Next Scheduled Run</span>
            <span className="text-sm font-semibold text-slate-200">Monday, 00:00 UTC</span>
          </div>
        </div>
      </div>

      {/* Reports Table Card */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-700/60 bg-surface-800/40 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
            Available Security Report Packages
          </h3>
          <span className="text-xs text-slate-500">{reports.length} standard templates</span>
        </div>

        <div className="divide-y divide-surface-700/40">
          {reports.map((rep) => (
            <div key={rep.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-surface-800/30 transition">
              <div className="space-y-1.5 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-100 text-sm">{rep.title}</span>
                  <Badge className="bg-surface-700 text-slate-300 text-xs">
                    {rep.category}
                  </Badge>
                  <span className="text-xs px-2 py-0.5 rounded bg-accent/10 text-accent font-mono">
                    {rep.format}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {rep.description}
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Frequency: {rep.frequency}
                  </span>
                  <span>Last generated: {rep.lastGenerated}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start md:self-center">
                <button
                  onClick={() => handleDownload(rep)}
                  disabled={downloadingId === rep.id}
                  className="btn-primary flex items-center gap-2 text-xs py-2 px-3"
                >
                  {downloadingId === rep.id ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating…
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      Export {rep.format}
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

