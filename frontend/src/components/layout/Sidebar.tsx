import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Server,
  Network,
  ShieldAlert,
  Bug,
  Radar,
  FileText,
  Settings,
  Shield,
} from "lucide-react";

// Sidebar navigation items — one entry per top-level page
const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/assets", label: "Assets", icon: Server },
  { to: "/digital-twin", label: "Digital Twin", icon: Network },
  { to: "/vulnerabilities", label: "Vulnerabilities", icon: Bug },
  { to: "/findings", label: "Findings", icon: ShieldAlert },
  { to: "/threat-intel", label: "Threat Intel", icon: Radar },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/settings", label: "Settings", icon: Settings },
];

/**
 * Left icon sidebar. Collapses to icons-only on small screens and shows
 * labels from the md breakpoint upward.
 */
export default function Sidebar() {
  return (
    <aside className="flex flex-col w-16 md:w-56 shrink-0 bg-surface-900 border-r border-surface-700/60 transition-all">
      {/* Brand */}
      <div className="flex items-center gap-3 h-16 px-4 border-b border-surface-700/60">
        <Shield className="w-7 h-7 text-accent shrink-0" />
        <span className="hidden md:block font-semibold text-lg tracking-wide">
          Cyber<span className="text-accent">Twin</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-accent/10 text-accent border border-accent/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-surface-800"
              }`
            }
            title={label}
          >
            <Icon className="w-5 h-5 shrink-0" />
            <span className="hidden md:block">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer version tag */}
      <div className="hidden md:block px-4 py-3 text-xs text-slate-600 border-t border-surface-700/60">
        v0.1.0 — Phase 1
      </div>
    </aside>
  );
}
