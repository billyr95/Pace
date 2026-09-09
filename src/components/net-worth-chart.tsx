"use client";

import { useState } from "react";
import { BalanceTrendChart, type BalancePoint } from "@/components/balance-trend-chart";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const RANGES = [
  { key: "30d", label: "30D", days: 30 },
  { key: "3m", label: "3M", days: 90 },
  { key: "6m", label: "6M", days: 180 },
  { key: "1y", label: "1Y", days: 365 },
] as const;
type RangeKey = (typeof RANGES)[number]["key"];

export function NetWorthChart({ points }: { points: BalancePoint[] }) {
  const [range, setRange] = useState<RangeKey>("30d");
  const days = RANGES.find((r) => r.key === range)!.days;
  const sliced = points.slice(-days);

  return (
    <div>
      <div className="mb-2 flex items-center justify-end">
        <ToggleGroup value={[range]} onValueChange={(values) => values[0] && setRange(values[0] as RangeKey)}>
          {RANGES.map((r) => (
            <ToggleGroupItem
              key={r.key}
              value={r.key}
              className="rounded-full px-2.5 py-1 text-[11px] font-semibold text-secondary/50 data-[state=on]:bg-muted data-[state=on]:text-ink"
            >
              {r.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <BalanceTrendChart points={sliced} />
    </div>
  );
}
