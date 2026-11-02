import { useLocation, useNavigate } from "react-router-dom";
import { Bell, Search, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

// Map routes to human-readable page titles
const titles: Record<string, string> = {
  "/": "Security Dashboard",
  "/assets": "Asset Inventory",
  "/digital-twin": "Digital Twin",
  "/vulnerabilities": "Vulnerabilities",
  "/findings": "Security Findings",
  "/threat-intel": "Threat Intelligence",
  "/reports": "Reports",
  "/settings": "Settings",
};

/** Top navigation bar: page title, global search, alerts, user menu. */
export default function TopBar() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="flex items-center justify-between h-16 px-4 md:px-6 bg-surface-900/80 backdrop-blur border-b border-surface-700/60">
      <h1 className="text-base md:text-lg font-semibold text-slate-100 truncate">
        {titles[pathname] ?? "CyberTwin"}
      </h1>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Global search (visual only in Phase 1) */}
        <div className="hidden sm:flex items-center gap-2 bg-surface-800 border border-surface-600/50 rounded-lg px-3 py-1.5 w-48 lg:w-64">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            className="bg-transparent outline-none text-sm w-full placeholder-slate-500"
            placeholder="Search assets, findings…"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-surface-800 transition-colors" title="Alerts">
          <Bell className="w-5 h-5 text-slate-400" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-severity-critical rounded-full" />
        </button>

        {/* User + logout */}
        <div className="flex items-center gap-3">
          <div className="hidden md:block text-right">
            <p className="text-sm text-slate-200 leading-tight">{user?.full_name ?? "Analyst"}</p>
            <p className="text-xs text-slate-500">{user?.role ?? "SOC"}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-surface-800 text-slate-400 hover:text-severity-critical transition-colors"
            title="Sign out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
