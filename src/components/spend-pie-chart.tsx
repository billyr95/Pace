"use client";

import { useState } from "react";
import { Cell, Pie, PieChart } from "recharts";
import type { ColoredAmount } from "@/lib/chart-palette";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";

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
      <p className="text-sm text-secondary/50">
        Nothing {verb} {rangePhrase} yet.
      </p>
    );
  }

  const active = hovered !== null ? slices[hovered] : null;
  const config: ChartConfig = Object.fromEntries(slices.map((s) => [s.name, { label: s.name, color: s.color }]));

  return (
    <div>
      <p className="mb-3 text-sm">
        {active ? (
          <>
            <span className="font-semibold text-ink">{active.name}</span>
            <span className="text-secondary/60">
              {" "}
              — ${active.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })} (
              {Math.round((active.amount / total) * 100)}%)
            </span>
          </>
        ) : (
          <span className="text-secondary/60">
            ${total.toLocaleString(undefined, { maximumFractionDigits: 0 })} {verb} {rangePhrase}
          </span>
        )}
      </p>
      <div className="flex items-center gap-4">
        <ChartContainer config={config} className="aspect-square h-36 w-36 shrink-0">
          <PieChart>
            <Pie
              data={slices}
              dataKey="amount"
              nameKey="name"
              outerRadius="90%"
              stroke="var(--surface)"
              strokeWidth={1.5}
              isAnimationActive={false}
              onMouseEnter={(_, index) => setHovered(index)}
              onMouseLeave={() => setHovered(null)}
            >
              {slices.map((slice, i) => (
                <Cell key={slice.name} fill={slice.color} opacity={hovered === null || hovered === i ? 1 : 0.35} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="min-w-0 flex-1 space-y-1.5">
          {slices.map((slice, i) => (
            <div
              key={slice.name}
              className="flex cursor-pointer items-center gap-1.5 text-xs"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: slice.color }} />
              <span className={`truncate ${hovered === i ? "font-semibold text-ink" : "text-secondary/70"}`}>
                {slice.name}
              </span>
              <span className="ml-auto shrink-0 tabular-nums text-secondary/50">
                {Math.round((slice.amount / total) * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
