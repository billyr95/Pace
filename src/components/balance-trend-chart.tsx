"use client";

import { useId, useMemo, useState } from "react";

export type BalancePoint = { date: string; balance: number };

const WIDTH = 320;
const HEIGHT = 120;
const PADDING = 8;

export function BalanceTrendChart({ points }: { points: BalancePoint[] }) {
  const gradientId = useId();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const { path, areaPath, coords, min, max } = useMemo(() => {
    if (points.length < 2) {
      return { path: "", areaPath: "", coords: [] as { x: number; y: number }[], min: 0, max: 0 };
    }
    const values = points.map((p) => p.balance);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const span = maxVal - minVal || 1;

    const coords = points.map((p, i) => {
      const x = PADDING + (i / (points.length - 1)) * (WIDTH - PADDING * 2);
      const y = HEIGHT - PADDING - ((p.balance - minVal) / span) * (HEIGHT - PADDING * 2);
      return { x, y };
    });

    const path = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
    const areaPath = `${path} L${coords[coords.length - 1].x.toFixed(1)},${HEIGHT} L${coords[0].x.toFixed(1)},${HEIGHT} Z`;

    return { path, areaPath, coords, min: minVal, max: maxVal };
  }, [points]);

  if (points.length < 2) {
    return <div className="flex h-[120px] items-center justify-center text-sm text-secondary/60">Not enough history yet</div>;
  }

  const active = hoverIndex !== null ? points[hoverIndex] : null;
  const activeCoord = hoverIndex !== null ? coords[hoverIndex] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        onMouseLeave={() => setHoverIndex(null)}
        onMouseMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const relX = ((event.clientX - rect.left) / rect.width) * WIDTH;
          const nearest = coords.reduce(
            (best, c, i) => (Math.abs(c.x - relX) < Math.abs(coords[best].x - relX) ? i : best),
            0,
          );
          setHoverIndex(nearest);
        }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#47D67A" stopOpacity={0.28} />
            <stop offset="100%" stopColor="#47D67A" stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path d={path} fill="none" stroke="#47D67A" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {activeCoord && (
          <line
            x1={activeCoord.x}
            y1={0}
            x2={activeCoord.x}
            y2={HEIGHT}
            style={{ stroke: "var(--secondary)" }}
            strokeOpacity={0.3}
            strokeWidth={1}
          />
        )}
        {activeCoord && (
          <circle
            cx={activeCoord.x}
            cy={activeCoord.y}
            r={4}
            style={{ fill: "var(--ink)", stroke: "var(--surface)" }}
            strokeWidth={2}
          />
        )}
      </svg>
      {active && activeCoord && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg bg-brand-dark px-2 py-1 text-xs font-medium whitespace-nowrap text-brand-paper"
          style={{ left: `${(activeCoord.x / WIDTH) * 100}%`, top: `${(activeCoord.y / HEIGHT) * 100}%` }}
        >
          {new Date(active.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })} · $
          {active.balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </div>
      )}
      <div className="mt-1 flex justify-between text-[10px] text-secondary/50">
        <span>{new Date(points[0].date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
        <span>{new Date(points[points.length - 1].date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
      </div>
      <span className="sr-only">
        Balance ranged from ${min.toLocaleString()} to ${max.toLocaleString()} over this period.
      </span>
    </div>
  );
}
