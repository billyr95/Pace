const SIZE = 148;
const STROKE = 10;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CircularProgress({
  pct,
  label,
  sublabel,
}: {
  pct: number;
  label: string;
  sublabel: string;
}) {
  const clamped = Math.min(100, Math.max(0, pct));
  const offset = CIRCUMFERENCE * (1 - clamped / 100);

  return (
    <div className="relative flex items-center justify-center" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} className="-rotate-90">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          style={{ stroke: "var(--divider)" }}
          strokeWidth={STROKE}
          fill="none"
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke="#47D67A"
          strokeWidth={STROKE}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute flex flex-col items-center gap-1 text-center" style={{ maxWidth: SIZE * 0.8 }}>
        <span className="text-base font-black">{label}</span>
        <span className="text-[11px] text-secondary/60">{sublabel}</span>
      </div>
    </div>
  );
}
