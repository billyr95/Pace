"use client";

import { Bar, BarChart, XAxis, YAxis } from "recharts";
import type { ColoredAmount } from "@/lib/chart-palette";
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart";

export type SpendBarGroup = { id: string; name: string; icon: string; total: number; segments: ColoredAmount[] };

export function CategorySpendBars({ groups }: { groups: SpendBarGroup[] }) {
  if (groups.length === 0) {
    return <p className="text-sm text-secondary/50">No spending yet this month.</p>;
  }
  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <SpendBarRow key={group.id} group={group} />
      ))}
    </div>
  );
}

function segmentRadius(index: number, count: number): number | [number, number, number, number] {
  if (count === 1) return 999;
  if (index === 0) return [999, 0, 0, 999];
  if (index === count - 1) return [0, 999, 999, 0];
  return 0;
}

function BarTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number; color?: string }[];
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="space-y-1 rounded-lg bg-brand-dark px-2 py-1.5 text-xs text-brand-paper">
      {payload.map((item) => (
        <div key={item.name} className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="h-2 w-2 shrink-0 rounded-sm" style={{ backgroundColor: item.color }} />
          {item.name}: ${Number(item.value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </div>
      ))}
    </div>
  );
}

function SpendBarRow({ group }: { group: SpendBarGroup }) {
  const row: Record<string, number | string> = { name: group.name };
  const config: ChartConfig = {};
  for (const seg of group.segments) {
    row[seg.name] = seg.amount;
    config[seg.name] = { label: seg.name, color: seg.color };
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 font-medium">
          <span className="text-sm leading-none">{group.icon}</span>
          {group.name}
        </span>
        <span className="tabular-nums text-secondary/70">
          ${group.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </span>
      </div>
      <ChartContainer config={config} className="aspect-auto h-5 w-full">
        <BarChart data={[row]} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <XAxis type="number" hide domain={[0, group.total]} />
          <YAxis type="category" dataKey="name" hide />
          <ChartTooltip cursor={false} content={<BarTooltip />} />
          {group.segments.map((seg, i) => (
            <Bar
              key={seg.name}
              dataKey={seg.name}
              stackId="stack"
              fill={seg.color}
              radius={segmentRadius(i, group.segments.length)}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ChartContainer>
    </div>
  );
}
