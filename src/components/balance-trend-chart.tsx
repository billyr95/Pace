"use client";

import { Area, AreaChart } from "recharts";
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart";

export type BalancePoint = { date: string; balance: number };

const chartConfig: ChartConfig = {
  balance: { label: "Balance", color: "var(--color-brand-green)" },
};

function BalanceTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload?: BalancePoint }[];
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  if (!point) return null;
  return (
    <div className="rounded-lg bg-brand-dark px-2 py-1 text-xs font-medium whitespace-nowrap text-brand-paper">
      {new Date(point.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })} · $
      {point.balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
    </div>
  );
}

export function BalanceTrendChart({ points }: { points: BalancePoint[] }) {
  if (points.length < 2) {
    return (
      <div className="flex h-[120px] items-center justify-center text-sm text-secondary">
        Not enough history yet
      </div>
    );
  }

  const values = points.map((p) => p.balance);
  const min = Math.min(...values);
  const max = Math.max(...values);

  return (
    <div>
      <ChartContainer config={chartConfig} className="aspect-auto h-[120px] w-full">
        <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <defs>
            <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-balance)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--color-balance)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <ChartTooltip cursor={{ stroke: "var(--secondary)", strokeOpacity: 0.3 }} content={<BalanceTooltip />} />
          <Area
            type="monotone"
            dataKey="balance"
            stroke="var(--color-balance)"
            strokeWidth={2}
            fill="url(#balanceFill)"
            dot={false}
            activeDot={{ r: 4, fill: "var(--ink)", stroke: "var(--surface)", strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ChartContainer>
      <div className="mt-1 flex justify-between text-[10px] text-secondary">
        <span>{new Date(points[0].date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
        <span>
          {new Date(points[points.length - 1].date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </span>
      </div>
      <span className="sr-only">
        Balance ranged from ${min.toLocaleString()} to ${max.toLocaleString()} over this period.
      </span>
    </div>
  );
}
