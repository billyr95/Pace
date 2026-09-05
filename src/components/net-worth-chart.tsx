"use client";

import { useState } from "react";
import { BalanceTrendChart, type BalancePoint } from "@/components/balance-trend-chart";

const RANGES = [
  { key: "30d", label: "30D", days: 30 },
  { key: "3m", label: "3M", days: 90 },
  { key: "6m", label: "6M", days: 180 },
  { key: "1y", label: "1Y", days: 365 },
] as const;

export function NetWorthChart({ points }: { points: BalancePoint[] }) {
  const [range, setRange] = useState<(typeof RANGES)[number]["key"]>("30d");
  const days = RANGES.find((r) => r.key === range)!.days;
  const sliced = points.slice(-days);

  return (
    <div>
      <div className="mb-2 flex items-center justify-end gap-1">
        {RANGES.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => setRange(r.key)}
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
              range === r.key ? "bg-muted text-ink" : "text-secondary/50"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>
      <BalanceTrendChart points={sliced} />
    </div>
  );
}
