import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function InsightsPage() {
  const session = await auth();
  const userId = session!.user.id;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const spendByCategory = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: { userId, date: { gte: monthStart }, amount: { gt: 0 } },
    _sum: { amount: true },
  });

  const categories = await prisma.category.findMany({ where: { userId } });
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  const rows = spendByCategory
    .map((row) => ({
      name: row.categoryId ? (categoryById.get(row.categoryId)?.name ?? "Other") : "Uncategorized",
      amount: row._sum.amount ?? 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const total = rows.reduce((sum, r) => sum + r.amount, 0);
  const max = Math.max(1, ...rows.map((r) => r.amount));

  return (
    <div className="space-y-6 px-5 pt-6">
      <h1 className="text-xl font-black">Insights</h1>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-sm text-brand-forest/70">Spent this month</p>
        <p className="text-2xl font-black">${total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-brand-forest/60">Spending breakdowns will appear here once you have transactions.</p>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-brand-forest/70">By category</h2>
          <ul className="space-y-3">
            {rows.map((row) => (
              <li key={row.name}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium">{row.name}</span>
                  <span className="text-brand-forest/70">${row.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-brand-mist">
                  <div
                    className="h-full rounded-full bg-brand-green"
                    style={{ width: `${(row.amount / max) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
