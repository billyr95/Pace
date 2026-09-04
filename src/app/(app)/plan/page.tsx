import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CircularProgress } from "@/components/circular-progress";
import { CategoryList } from "@/components/category-list";

export default async function PlanPage() {
  const session = await auth();
  const userId = session!.user.id;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const categories = await prisma.category.findMany({
    where: { userId },
    orderBy: { monthlyLimit: "desc" },
    include: {
      transactions: {
        where: { date: { gte: monthStart }, amount: { gt: 0 } },
        select: { amount: true },
      },
    },
  });

  const rows = categories.map((c) => ({
    id: c.id,
    name: c.name,
    icon: c.icon,
    monthlyLimit: c.monthlyLimit,
    spent: c.transactions.reduce((sum, t) => sum + t.amount, 0),
  }));

  const totalBudget = rows.reduce((sum, r) => sum + (r.monthlyLimit ?? 0), 0);
  const totalSpent = rows.reduce((sum, r) => sum + r.spent, 0);
  const left = totalBudget - totalSpent;
  const pct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  return (
    <div className="space-y-6 px-5 pt-6">
      <h1 className="text-xl font-black">Plan</h1>

      <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
        <div>
          <p className="text-sm text-brand-forest/70">
            ${Math.max(0, left).toLocaleString(undefined, { maximumFractionDigits: 0 })} left
          </p>
          <p className="text-xs text-brand-forest/50">to budget this month</p>
        </div>
        <CircularProgress
          pct={pct}
          label={`$${totalSpent.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          sublabel={`of $${totalBudget.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
        />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-brand-forest/70">Categories</h2>
        {rows.length > 0 ? (
          <CategoryList categories={rows} />
        ) : (
          <p className="text-sm text-brand-forest/60">No categories yet.</p>
        )}
      </div>
    </div>
  );
}
