import Link from "next/link";
import { Target } from "lucide-react";
import type { GoalRow } from "@/components/goal-list";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function GoalsSummaryCard({ goals }: { goals: GoalRow[] }) {
  const active = goals.filter((g) => g.targetAmount !== null);

  return (
    <Card>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Target size={15} className="text-brand-green" />
            <h2 className="text-sm font-semibold text-secondary">Goals</h2>
          </div>
          <Link href="/plan" className="text-xs font-medium text-secondary underline">
            Manage
          </Link>
        </div>

        {active.length === 0 ? (
          <p className="mt-2 text-sm text-secondary">
            No savings goals yet — head to Plan &gt; Goals to add one, like a vacation fund or an emergency fund.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {active.map((goal) => {
              const pct = Math.min(100, Math.round((goal.totalContributed / goal.targetAmount!) * 100));
              return (
                <li key={goal.categoryId}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="leading-none">{goal.icon}</span>
                      {goal.name}
                    </span>
                    <span className="text-xs text-secondary">
                      ${goal.totalContributed.toLocaleString(undefined, { maximumFractionDigits: 0 })} of $
                      {goal.targetAmount!.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <Progress value={pct} />
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
