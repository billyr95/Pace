import { PartyPopper } from "lucide-react";

export function MonthlyRecapCard({
  monthLabel,
  earned,
  spent,
  saved,
  savingsRatePct,
  biggestSplurge,
}: {
  monthLabel: string;
  earned: number;
  spent: number;
  saved: number;
  savingsRatePct: number;
  biggestSplurge: { name: string; amount: number } | undefined;
}) {
  if (earned === 0 && spent === 0) return null;
  const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;

  return (
    <div className="rounded-2xl border border-white/10 bg-brand-dark p-4 text-brand-paper">
      <div className="flex items-center gap-1.5">
        <PartyPopper size={15} className="text-brand-green" />
        <h2 className="text-sm font-semibold text-brand-paper/70">{monthLabel} recap</h2>
      </div>
      <ul className="mt-3 space-y-1.5 text-sm">
        <li>
          You earned <span className="font-semibold">{fmt(earned)}</span>
        </li>
        <li>
          You spent <span className="font-semibold">{fmt(spent)}</span>
        </li>
        <li>
          You saved <span className="font-semibold text-brand-green">{fmt(saved)}</span>
          {earned > 0 && <> — that&rsquo;s a {savingsRatePct}% savings rate.</>}
        </li>
        {biggestSplurge && (
          <li className="pt-1 text-brand-paper/70">
            Your biggest splurge was <span className="font-semibold text-brand-paper">{biggestSplurge.name}</span> —{" "}
            {fmt(biggestSplurge.amount)}.
          </li>
        )}
      </ul>
    </div>
  );
}
