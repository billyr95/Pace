"use client";

import { useState } from "react";
import type { ColoredAmount } from "@/lib/chart-palette";

const CX = 90;
const CY = 90;
const R = 80;

function arcPath(startAngle: number, endAngle: number) {
  const x1 = CX + R * Math.cos(startAngle);
  const y1 = CY + R * Math.sin(startAngle);
  const x2 = CX + R * Math.cos(endAngle);
  const y2 = CY + R * Math.sin(endAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M${CX},${CY} L${x1.toFixed(2)},${y1.toFixed(2)} A${R},${R} 0 ${largeArc} 1 ${x2.toFixed(2)},${y2.toFixed(2)} Z`;
}

export function SpendPieChart({
  slices,
  total,
  rangePhrase,
  verb = "spent",
}: {
  slices: ColoredAmount[];
  total: number;
  rangePhrase: string;
  verb?: string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);

  if (total <= 0 || slices.length === 0) {
    return (
      <p className="text-sm text-brand-forest/50">
        Nothing {verb} {rangePhrase} yet.
      </p>
    );
  }

  const wedges = slices.map((slice, i) => {
    const priorAmount = slices.slice(0, i).reduce((sum, s) => sum + s.amount, 0);
    const start = (priorAmount / total) * 2 * Math.PI - Math.PI / 2;
    const end = ((priorAmount + slice.amount) / total) * 2 * Math.PI - Math.PI / 2;
    return { ...slice, i, d: arcPath(start, end) };
  });

  const active = hovered !== null ? slices[hovered] : null;

  return (
    <div>
      <p className="mb-3 text-sm">
        {active ? (
          <>
            <span className="font-semibold text-brand-dark">{active.name}</span>
            <span className="text-brand-forest/60">
              {" "}
              — ${active.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })} (
              {Math.round((active.amount / total) * 100)}%)
            </span>
          </>
        ) : (
          <span className="text-brand-forest/60">
            ${total.toLocaleString(undefined, { maximumFractionDigits: 0 })} {verb} {rangePhrase}
          </span>
        )}
      </p>
      <div className="flex items-center gap-4">
        <svg viewBox="0 0 180 180" className="h-36 w-36 shrink-0">
          {wedges.map((w) => (
            <path
              key={w.name}
              d={w.d}
              fill={w.color}
              stroke="#fff"
              strokeWidth={1.5}
              opacity={hovered === null || hovered === w.i ? 1 : 0.35}
              className="cursor-pointer transition-opacity"
              onMouseEnter={() => setHovered(w.i)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(w.i)}
              onBlur={() => setHovered(null)}
              tabIndex={0}
            />
          ))}
        </svg>
        <div className="min-w-0 flex-1 space-y-1.5">
          {slices.map((slice, i) => (
            <div
              key={slice.name}
              className="flex cursor-pointer items-center gap-1.5 text-xs"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: slice.color }} />
              <span className={`truncate ${hovered === i ? "font-semibold text-brand-dark" : "text-brand-forest/70"}`}>
                {slice.name}
              </span>
              <span className="ml-auto shrink-0 tabular-nums text-brand-forest/50">
                {Math.round((slice.amount / total) * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
