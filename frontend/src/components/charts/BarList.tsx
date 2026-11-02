interface BarItem {
  label: string;
  value: number;
  /** Optional per-bar color; falls back to the accent color. */
  color?: string;
  /** Optional secondary text shown on the right (e.g. count). */
  suffix?: string;
}

interface BarListProps {
  items: BarItem[];
  /** Format the numeric value shown at the end of each bar. */
  format?: (v: number) => string;
  emptyText?: string;
}

/**
 * Horizontal bar list — each row is a label with a proportional bar.
 * Bars are scaled to the largest value in the set.
 */
export default function BarList({ items, format, emptyText = "No data yet." }: BarListProps) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-500 py-6 text-center">{emptyText}</p>;
  }
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-slate-300 truncate pr-2">{item.label}</span>
            <span className="text-slate-400 tabular-nums shrink-0">
              {item.suffix ?? (format ? format(item.value) : item.value)}
            </span>
          </div>
          <div className="h-2 rounded-full bg-surface-900 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${(item.value / max) * 100}%`, backgroundColor: item.color ?? "#22d3ee" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
