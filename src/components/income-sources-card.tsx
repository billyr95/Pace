import { Wallet } from "lucide-react";
import type { RecurringItem } from "@/lib/recurring";
import { Card, CardContent } from "@/components/ui/card";

export function IncomeSourcesCard({ sources }: { sources: RecurringItem[] }) {
  if (sources.length === 0) return null;

  const cadenceLabel = (days: number) => {
    if (days <= 9) return "weekly";
    if (days <= 18) return "every 2 weeks";
    if (days <= 35) return "monthly";
    return `every ~${days} days`;
  };

  return (
    <Card>
      <CardContent>
        <div className="flex items-center gap-1.5">
          <Wallet size={15} className="text-brand-green" />
          <h2 className="text-sm font-semibold text-secondary/70">Income sources</h2>
        </div>
        <ul className="mt-2 space-y-2">
          {sources.map((source) => (
            <li key={source.key} className="flex items-center justify-between text-sm">
              <span>
                <span className="font-semibold capitalize">{source.displayName}</span>{" "}
                <span className="text-secondary/50">({cadenceLabel(source.intervalDays)})</span>
              </span>
              <span className="font-semibold text-brand-green">
                +${source.averageAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
