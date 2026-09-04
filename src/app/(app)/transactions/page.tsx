import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { TransactionRow } from "@/components/transaction-row";

function groupByDay<T extends { date: Date }>(transactions: T[]) {
  const groups = new Map<string, T[]>();
  for (const t of transactions) {
    const key = t.date.toISOString().slice(0, 10);
    const list = groups.get(key) ?? [];
    list.push(t);
    groups.set(key, list);
  }
  return groups;
}

export default async function TransactionsPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [transactions, categories] = await Promise.all([
    prisma.transaction.findMany({ where: { userId }, orderBy: { date: "desc" }, take: 100 }),
    prisma.category.findMany({ where: { userId }, select: { id: true, name: true } }),
  ]);

  const grouped = groupByDay(transactions);

  return (
    <div className="space-y-6 px-5 pt-6">
      <h1 className="text-xl font-black">Transactions</h1>

      {transactions.length === 0 ? (
        <p className="text-sm text-brand-forest/60">
          No transactions yet. Connect a bank account from the Home tab to get started.
        </p>
      ) : (
        Array.from(grouped.entries()).map(([day, rows]) => (
          <div key={day}>
            <h2 className="mb-2 text-xs font-semibold text-brand-forest/50">
              {new Date(day).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
            </h2>
            <ul className="space-y-2">
              {rows.map((t) => (
                <TransactionRow key={t.id} transaction={t} categories={categories} />
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}
