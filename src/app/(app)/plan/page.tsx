import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CircularProgress } from "@/components/circular-progress";
import { CategoryList } from "@/components/category-list";
import { aggregate, flattenLeaves } from "@/lib/category-tree";
import { INCOME_ROOT_CATEGORIES } from "@/lib/default-categories";

export default async function PlanPage() {
  const session = await auth();
  const userId = session!.user.id;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const txSelect = { where: { date: { gte: monthStart } }, select: { amount: true } } as const;

  const rawGroups = await prisma.category.findMany({
    where: { userId, parentId: null },
    orderBy: { name: "asc" },
    include: {
      transactions: txSelect,
      children: {
        orderBy: { name: "asc" },
        include: {
          transactions: txSelect,
          children: {
            orderBy: { name: "asc" },
            include: { transactions: txSelect },
          },
        },
      },
    },
  });

  const groups = rawGroups.map((g) => ({ ...aggregate(g), isIncome: INCOME_ROOT_CATEGORIES.has(g.name) }));

  const expenseGroups = groups.filter((g) => !g.isIncome);
  const totalBudget = expenseGroups.reduce((sum, g) => sum + g.totalBudget, 0);
  const totalSpent = expenseGroups.reduce((sum, g) => sum + g.totalSpent, 0);
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
        {groups.length === 0 ? (
          <p className="text-sm text-brand-forest/60">No categories yet.</p>
        ) : (
          <ul className="space-y-2">
            {groups.map((group) => {
              const leaves = flattenLeaves(group, group.isIncome);
              return (
                <li key={group.id} className="rounded-2xl bg-white shadow-sm">
                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 [&::-webkit-details-marker]:hidden">
                      <span className="text-lg leading-none">{group.icon}</span>
                      <span className="flex-1 text-sm font-semibold">{group.name}</span>
                      {group.isIncome ? (
                        group.totalReceived > 0 && (
                          <span className="text-xs font-semibold text-brand-green">
                            +${group.totalReceived.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </span>
                        )
                      ) : group.totalBudget > 0 ? (
                        <span className="text-xs text-brand-forest/60">
                          ${group.totalSpent.toLocaleString(undefined, { maximumFractionDigits: 0 })} / $
                          {group.totalBudget.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                      ) : (
                        group.totalSpent > 0 && (
                          <span className="text-xs text-brand-forest/50">
                            ${group.totalSpent.toLocaleString(undefined, { maximumFractionDigits: 0 })} spent
                          </span>
                        )
                      )}
                      <svg
                        viewBox="0 0 20 20"
                        className="h-4 w-4 shrink-0 text-brand-forest/40 transition-transform group-open:rotate-180"
                        fill="currentColor"
                      >
                        <path
                          d="M5.5 7.5l4.5 4.5 4.5-4.5"
                          stroke="currentColor"
                          strokeWidth={1.5}
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </summary>
                    <div className="border-t border-brand-mist px-4 py-3">
                      <CategoryList categories={leaves} isIncome={group.isIncome} />
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
