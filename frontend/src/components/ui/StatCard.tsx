import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  delta?: string;
  icon: LucideIcon;
  accentClass?: string; // tailwind text color class for the icon
}

/** Reusable KPI card used across dashboard pages. */
export default function StatCard({ title, value, delta, icon: Icon, accentClass = "text-accent" }: StatCardProps) {
  return (
    <div className="card hover:shadow-glow hover:border-accent/30 transition-all">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-100">{value}</p>
          {delta && <p className="mt-1 text-xs text-slate-400">{delta}</p>}
        </div>
        <div className="p-2.5 rounded-lg bg-surface-900">
          <Icon className={`w-5 h-5 ${accentClass}`} />
        </div>
      </div>
    </div>
  );
}
