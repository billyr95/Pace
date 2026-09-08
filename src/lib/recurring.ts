import { merchantKey } from "@/lib/merchant-key";

export type RecurringItem = {
  key: string;
  displayName: string;
  averageAmount: number;
  intervalDays: number;
  lastDate: Date;
  nextDueDate: Date;
  occurrences: number;
};

export type RecurringBill = RecurringItem;

type TxLike = { name: string; merchantName: string | null; amount: number; date: Date };

/**
 * Flags merchants moving a roughly fixed amount on a fixed cadence (weekly to monthly).
 * Deliberately conservative — amount and spacing both have to be fairly consistent, and the
 * pattern must still look "live" (the most recent hit can't be more than ~2 cycles old) or
 * it's probably cancelled/no longer active.
 */
function detectRecurring(transactions: TxLike[], now: Date, direction: "in" | "out"): RecurringItem[] {
  const groups = new Map<string, { displayName: string; entries: { amount: number; date: Date }[] }>();
  for (const t of transactions) {
    const isMatch = direction === "out" ? t.amount > 0 : t.amount < 0;
    if (!isMatch) continue;
    const key = merchantKey(t);
    const displayName = (t.merchantName?.trim() || t.name.trim()).replace(/\s+/g, " ");
    const group = groups.get(key) ?? { displayName, entries: [] };
    group.entries.push({ amount: Math.abs(t.amount), date: t.date });
    groups.set(key, group);
  }

  const items: RecurringItem[] = [];

  for (const [key, group] of groups) {
    if (group.entries.length < 3) continue;
    const sorted = [...group.entries].sort((a, b) => a.date.getTime() - b.date.getTime());

    const amounts = sorted.map((e) => e.amount);
    const avgAmount = amounts.reduce((s, a) => s + a, 0) / amounts.length;
    const amountSpread = Math.max(...amounts) - Math.min(...amounts);
    if (amountSpread > avgAmount * 0.15 + 1) continue;

    const intervals: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      intervals.push((sorted[i].date.getTime() - sorted[i - 1].date.getTime()) / 86_400_000);
    }
    const avgInterval = intervals.reduce((s, d) => s + d, 0) / intervals.length;
    if (avgInterval < 5 || avgInterval > 40) continue;
    const intervalSpread = Math.max(...intervals) - Math.min(...intervals);
    if (intervalSpread > avgInterval * 0.5 + 3) continue;

    const last = sorted[sorted.length - 1];
    const daysSinceLast = (now.getTime() - last.date.getTime()) / 86_400_000;
    if (daysSinceLast > avgInterval * 2) continue;

    items.push({
      key,
      displayName: group.displayName,
      averageAmount: avgAmount,
      intervalDays: Math.round(avgInterval),
      lastDate: last.date,
      nextDueDate: new Date(last.date.getTime() + avgInterval * 86_400_000),
      occurrences: sorted.length,
    });
  }

  return items.sort((a, b) => a.nextDueDate.getTime() - b.nextDueDate.getTime());
}

export function detectRecurringBills(transactions: TxLike[], now: Date): RecurringItem[] {
  return detectRecurring(transactions, now, "out");
}

/** Same pattern-matching as detectRecurringBills, but for money coming in — paychecks, etc. */
export function detectRecurringIncome(transactions: TxLike[], now: Date): RecurringItem[] {
  return detectRecurring(transactions, now, "in");
}
