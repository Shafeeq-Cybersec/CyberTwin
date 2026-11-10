import { useState } from "react";
import {
  Settings as SettingsIcon,
  Shield,
  Bell,
  Database,
  Key,
  Save,
  CheckCircle2,
} from "lucide-react";

export default function Settings() {
  const [activeTab, setActiveTab] = useState<"general" | "integrations" | "security" | "notifications">("general");
  const [saved, setSaved] = useState(false);

  // Settings form states
  const [appName, setAppName] = useState("CyberTwin Platform");
  const [env, setEnv] = useState("Production");
  const [retentionDays, setRetentionDays] = useState(90);
  const [cisaSync, setCisaSync] = useState(true);
  const [nvdSync, setNvdSync] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(60);
  const [mfaEnforced, setMfaEnforced] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState("https://hooks.slack.com/services/T00/B00/XXXX");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-accent" /> Platform Settings & Governance
        </h2>
        <p className="text-sm text-slate-400 mt-0.5">
          Configure security baselines, threat feeds synchronization, API webhooks, and session controls.
        </p>
      </div>

      {saved && (
        <div className="p-3 rounded-xl bg-severity-low/10 border border-severity-low/20 text-severity-low text-sm flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>Platform configuration updated successfully. Changes applied across active instances.</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-surface-700/60 gap-4">
        <button
          onClick={() => setActiveTab("general")}
          className={`pb-3 text-sm font-medium border-b-2 transition ${
            activeTab === "general"
              ? "border-accent text-accent"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          General & Environment
        </button>
        <button
          onClick={() => setActiveTab("integrations")}
          className={`pb-3 text-sm font-medium border-b-2 transition ${
            activeTab === "integrations"
              ? "border-accent text-accent"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Threat Feeds & Sync
        </button>
        <button
          onClick={() => setActiveTab("security")}
          className={`pb-3 text-sm font-medium border-b-2 transition ${
            activeTab === "security"
              ? "border-accent text-accent"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Zero Trust & Security
        </button>
        <button
          onClick={() => setActiveTab("notifications")}
          className={`pb-3 text-sm font-medium border-b-2 transition ${
            activeTab === "notifications"
              ? "border-accent text-accent"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          SIEM & Webhooks
        </button>
      </div>

      {/* Form content */}
      <form onSubmit={handleSave} className="card p-6 space-y-6 max-w-3xl">
        {activeTab === "general" && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Database className="w-4 h-4 text-accent" /> System Configuration
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1.5">
                  Platform Name
                </label>
                <input
                  type="text"
                  className="input"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1.5">
                  Environment
                </label>
                <select
                  className="input"
                  value={env}
                  onChange={(e) => setEnv(e.target.value)}
                >
                  <option value="Development">Development</option>
                  <option value="Staging">Staging</option>
                  <option value="Production">Production</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1.5">
                Audit Log Retention (Days)
              </label>
              <input
                type="number"
                className="input"
                value={retentionDays}
                onChange={(e) => setRetentionDays(Number(e.target.value))}
                min={30}
                max={365}
              />
            </div>
          </div>
        )}

        {activeTab === "integrations" && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Shield className="w-4 h-4 text-accent" /> Intelligence Feeds
            </h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 rounded-xl bg-surface-800/60 border border-surface-700/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cisaSync}
                  onChange={(e) => setCisaSync(e.target.checked)}
                  className="w-4 h-4 rounded text-accent focus:ring-accent"
                />
                <div>
                  <div className="text-sm font-medium text-slate-200">CISA Known Exploited Vulnerabilities (KEV)</div>
                  <div className="text-xs text-slate-500">Auto-sync daily catalogue of weaponized CVEs</div>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-xl bg-surface-800/60 border border-surface-700/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={nvdSync}
                  onChange={(e) => setNvdSync(e.target.checked)}
                  className="w-4 h-4 rounded text-accent focus:ring-accent"
                />
                <div>
                  <div className="text-sm font-medium text-slate-200">NVD & FIRST EPSS Probability Feeds</div>
                  <div className="text-xs text-slate-500">Enrich CVE items with live exploitation likelihood percentiles</div>
                </div>
              </label>
            </div>
          </div>
        )}

        {activeTab === "security" && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Key className="w-4 h-4 text-accent" /> Identity & Access Safeguards
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1.5">
                  Session Expiration (Minutes)
                </label>
                <input
                  type="number"
                  className="input"
                  value={sessionTimeout}
                  onChange={(e) => setSessionTimeout(Number(e.target.value))}
                  min={15}
                  max={480}
                />
              </div>
              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-800/60 border border-surface-700/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mfaEnforced}
                    onChange={(e) => setMfaEnforced(e.target.checked)}
                    className="w-4 h-4 rounded text-accent focus:ring-accent"
                  />
                  <span className="text-xs font-medium text-slate-200">Enforce Hardware MFA for SecOps</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Bell className="w-4 h-4 text-accent" /> Alert Dispatch & Webhooks
            </h3>
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1.5">
                SOC Incident Webhook URL (Slack / Teams / Splunk)
              </label>
              <input
                type="url"
                className="input"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://..."
              />
              <span className="text-xs text-slate-500 mt-1 block">
                Fires instant webhooks when critical severity findings or breach paths are discovered.
              </span>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-surface-700/60 flex justify-end">
          <button type="submit" className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
            <Save className="w-4 h-4" /> Save Platform Configuration
          </button>
        </div>
      </form>
    </div>
  );
}

