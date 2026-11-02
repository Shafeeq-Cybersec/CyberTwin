import type { ReactNode } from "react";

/** Small pill label with caller-supplied color classes. */
export default function Badge({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-block text-xs px-2 py-0.5 rounded border uppercase font-medium tracking-wide ${className}`}
    >
      {children}
    </span>
  );
}
