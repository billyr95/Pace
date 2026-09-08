export type SpendingPersonality = {
  biggestCategory: { name: string; total: number } | null;
  mostConsistent: { name: string; average: number } | null;
  mostVariable: { name: string; average: number } | null;
};

type TxLike = { amount: number; date: Date; categoryName: string | null };

/**
 * Buckets spend by category and by month over the sampled window, then reads three facts out
 * of that grid: which category gets the most money overall, which one barely changes month to
 * month (low coefficient of variation — a proxy for "fixed" spending like rent), and which one
 * swings the most (high CV — irregular, discretionary spending). Consistency comparisons only
 * consider categories that actually show up in most months, since a category hit once has a
 * meaningless (zero) variance.
 */
export function computeSpendingPersonality(transactions: TxLike[], monthKeys: string[]): SpendingPersonality {
  const byCategory = new Map<string, Map<string, number>>();
  for (const t of transactions) {
    if (t.amount <= 0 || !t.categoryName) continue;
    const monthKey = `${t.date.getFullYear()}-${t.date.getMonth()}`;
    const monthMap = byCategory.get(t.categoryName) ?? new Map<string, number>();
    monthMap.set(monthKey, (monthMap.get(monthKey) ?? 0) + t.amount);
    byCategory.set(t.categoryName, monthMap);
  }

  let biggestCategory: { name: string; total: number } | null = null;
  let mostConsistent: { name: string; average: number; cv: number } | null = null;
  let mostVariable: { name: string; average: number; cv: number } | null = null;
  const minMonthsPresent = Math.max(2, Math.ceil(monthKeys.length * 0.5));

  for (const [name, monthMap] of byCategory) {
    const amounts = monthKeys.map((k) => monthMap.get(k) ?? 0);
    const total = amounts.reduce((s, a) => s + a, 0);

    if (!biggestCategory || total > biggestCategory.total) biggestCategory = { name, total };

    const monthsPresent = amounts.filter((a) => a > 0).length;
    if (monthsPresent < minMonthsPresent) continue;

    const mean = total / amounts.length;
    const variance = amounts.reduce((s, a) => s + (a - mean) ** 2, 0) / amounts.length;
    const cv = mean > 0 ? Math.sqrt(variance) / mean : 0;

    if (!mostConsistent || cv < mostConsistent.cv) mostConsistent = { name, average: mean, cv };
    if (!mostVariable || cv > mostVariable.cv) mostVariable = { name, average: mean, cv };
  }

  return {
    biggestCategory,
    mostConsistent: mostConsistent ? { name: mostConsistent.name, average: mostConsistent.average } : null,
    mostVariable: mostVariable ? { name: mostVariable.name, average: mostVariable.average } : null,
  };
}
