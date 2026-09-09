import { Droplets } from "lucide-react";
import type { MoneyLeak } from "@/lib/money-leaks";
import { Card, CardContent } from "@/components/ui/card";

export function MoneyLeaksCard({ leaks }: { leaks: MoneyLeak[] }) {
  if (leaks.length === 0) return null;

  return (
    <Card>
      <CardContent>
        <div className="flex items-center gap-1.5">
          <Droplets size={15} className="text-brand-green" />
          <h2 className="text-sm font-semibold text-secondary/70">Money leaks</h2>
        </div>
        <ul className="mt-2 space-y-1.5">
          {leaks.map((leak) => (
            <li key={leak.categoryName} className="text-sm">
              You&rsquo;re spending ~${Math.round(leak.monthlyAverage).toLocaleString()}/month on{" "}
              <span className="font-semibold">{leak.categoryName}</span> across{" "}
              {leak.occurrencesPerMonth.toFixed(1)} small charges a month.
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
