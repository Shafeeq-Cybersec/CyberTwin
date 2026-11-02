interface Segment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: Segment[];
  centerLabel?: string;
  centerValue?: string | number;
}

/**
 * Pure-SVG donut chart. Segments are drawn as stroked circle arcs via
 * stroke-dasharray, so there are no external chart dependencies.
 */
export default function DonutChart({ data, centerLabel, centerValue }: DonutChartProps) {
  const total = data.reduce((sum, s) => sum + s.value, 0);
  const radius = 60;
  const circumference = 2 * Math.PI * radius;

  // Running offset so each arc starts where the previous ended
  let offset = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <svg viewBox="0 0 160 160" className="w-40 h-40 shrink-0 -rotate-90">
        {/* Track */}
        <circle cx="80" cy="80" r={radius} fill="none" stroke="#1b2438" strokeWidth="18" />
        {total > 0 &&
          data.map((s) => {
            const fraction = s.value / total;
            const dash = fraction * circumference;
            const seg = (
              <circle
                key={s.label}
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke={s.color}
                strokeWidth="18"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
              />
            );
            offset += dash;
            return seg;
          })}
      </svg>

      <div className="flex-1 w-full space-y-2">
        {/* Center total shown inline in the legend area for small screens */}
        {(centerLabel || centerValue !== undefined) && (
          <div className="mb-3">
            <p className="text-2xl font-semibold text-slate-100 tabular-nums">{centerValue}</p>
            <p className="text-xs text-slate-500">{centerLabel}</p>
          </div>
        )}
        {data.map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-sm">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-slate-300 flex-1">{s.label}</span>
            <span className="text-slate-400 tabular-nums">{s.value}</span>
            <span className="text-slate-600 text-xs tabular-nums w-10 text-right">
              {total > 0 ? Math.round((s.value / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
