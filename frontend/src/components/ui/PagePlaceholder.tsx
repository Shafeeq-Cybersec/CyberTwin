import type { LucideIcon } from "lucide-react";

interface PagePlaceholderProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

/** Placeholder body for pages whose business logic lands in later phases. */
export default function PagePlaceholder({ title, description, icon: Icon }: PagePlaceholderProps) {
  return (
    <div className="card flex flex-col items-center justify-center text-center py-20">
      <div className="p-4 rounded-2xl bg-surface-900 mb-4">
        <Icon className="w-10 h-10 text-accent" />
      </div>
      <h2 className="text-xl font-semibold text-slate-100">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-slate-400">{description}</p>
      <span className="mt-4 text-xs px-3 py-1 rounded-full bg-accent/10 text-accent border border-accent/20">
        Coming in a later phase
      </span>
    </div>
  );
}
