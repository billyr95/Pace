import type { BalancePoint } from "@/components/balance-trend-chart";

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

/**
 * Plaid has no historical daily-balance endpoint, so this walks backward from
 * today's known balance, undoing each day's net transaction flow (Plaid's
 * convention: a positive amount is money OUT) to approximate prior days.
 */
export function buildBalanceHistory(
  currentTotal: number,
  transactions: { amount: number; date: Date }[],
  now: Date,
  days = 30,
): BalancePoint[] {
  const netByDay = new Map<string, number>();
  for (const txn of transactions) {
    const key = dayKey(txn.date);
    netByDay.set(key, (netByDay.get(key) ?? 0) + txn.amount);
  }

  const points: BalancePoint[] = [];
  let runningBalance = currentTotal;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const key = dayKey(date);

    points.push({ date: key, balance: runningBalance });
    runningBalance += netByDay.get(key) ?? 0;
  }

  return points.reverse();
}
