"use client";

import { useState } from "react";
import type { ColoredAmount } from "@/lib/chart-palette";

export type SpendBarGroup = { id: string; name: string; icon: string; total: number; segments: ColoredAmount[] };

export function CategorySpendBars({ groups }: { groups: SpendBarGroup[] }) {
  if (groups.length === 0) {
    return <p className="text-sm text-brand-forest/50">No spending yet this month.</p>;
  }
  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <SpendBarRow key={group.id} group={group} />
      ))}
    </div>
  );
}

function SpendBarRow({ group }: { group: SpendBarGroup }) {
  const [hovered, setHovered] = useState<number | null>(null);

  const positioned = group.segments.map((seg, i) => {
    const pct = (seg.amount / group.total) * 100;
    const priorAmount = group.segments.slice(0, i).reduce((sum, s) => sum + s.amount, 0);
    const start = (priorAmount / group.total) * 100;
    return { ...seg, pct, start, i };
  });
  const active = hovered !== null ? positioned[hovered] : null;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 font-medium">
          <span className="text-sm leading-none">{group.icon}</span>
          {group.name}
        </span>
        <span className="tabular-nums text-brand-forest/70">
          ${group.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </span>
      </div>
      <div className="relative">
        {active && (
          <div
            className="pointer-events-none absolute bottom-full z-10 mb-1.5 -translate-x-1/2 rounded-lg bg-brand-dark px-2 py-1 text-xs whitespace-nowrap text-brand-paper"
            style={{ left: `${Math.min(94, Math.max(6, active.start + active.pct / 2))}%` }}
          >
            {active.name}: ${active.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        )}
        <div className="flex h-5 w-full gap-[2px] overflow-hidden rounded-full">
          {positioned.map((seg) => (
            <div
              key={seg.name}
              style={{ width: `${seg.pct}%`, backgroundColor: seg.color }}
              className="h-full cursor-pointer transition-opacity"
              tabIndex={0}
              onMouseEnter={() => setHovered(seg.i)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(seg.i)}
              onBlur={() => setHovered(null)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
