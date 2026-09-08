export type MoneyLeak = {
  categoryName: string;
  monthlyAverage: number;
  occurrencesPerMonth: number;
};

type TxLike = { amount: number; categoryName: string | null };

const SMALL_AMOUNT_CEILING = 20;
const MIN_MONTHLY_AVERAGE = 15;
const MIN_OCCURRENCES_PER_MONTH = 3;

/**
 * Small, frequent charges in the same category rarely register individually but add up —
 * this sums them per category over the sampled window and flags ones that clear a "this is
 * an actual leak, not just a one-off" bar on both total and frequency.
 */
export function detectMoneyLeaks(transactions: TxLike[], monthsSpanned: number): MoneyLeak[] {
  const byCategory = new Map<string, { total: number; count: number }>();
  for (const t of transactions) {
    if (t.amount <= 0 || t.amount > SMALL_AMOUNT_CEILING || !t.categoryName) continue;
    const entry = byCategory.get(t.categoryName) ?? { total: 0, count: 0 };
    entry.total += t.amount;
    entry.count += 1;
    byCategory.set(t.categoryName, entry);
  }

  const leaks: MoneyLeak[] = [];
  for (const [categoryName, { total, count }] of byCategory) {
    const monthlyAverage = total / monthsSpanned;
    const occurrencesPerMonth = count / monthsSpanned;
    if (monthlyAverage >= MIN_MONTHLY_AVERAGE && occurrencesPerMonth >= MIN_OCCURRENCES_PER_MONTH) {
      leaks.push({ categoryName, monthlyAverage, occurrencesPerMonth });
    }
  }
  return leaks.sort((a, b) => b.monthlyAverage - a.monthlyAverage);
}
