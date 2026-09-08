import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CircularProgress } from "@/components/circular-progress";
import { CategoryList } from "@/components/category-list";
import { GoalList, type GoalRow } from "@/components/goal-list";
import { AddCategoryForm } from "@/components/add-category-form";
import { BudgetFeedback } from "@/components/budget-feedback";
import { aggregate, flattenLeaves } from "@/lib/category-tree";
import { INCOME_ROOT_CATEGORIES, GOAL_ROOT_CATEGORIES } from "@/lib/default-categories";

export default async function PlanPage() {
  const session = await auth();
  const userId = session!.user.id;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const priorMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  const txSelect = { where: { date: { gte: monthStart } }, select: { amount: true } } as const;

  const [rawGroups, priorMonthTx] = await Promise.all([
    prisma.category.findMany({
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
    }),
    prisma.transaction.findMany({
      where: { userId, date: { gte: priorMonthStart, lt: monthStart }, amount: { gt: 0 }, categoryId: { not: null } },
      select: { categoryId: true, amount: true },
    }),
  ]);

  const priorMonthByCategory = new Map<string, number>();
  for (const t of priorMonthTx) {
    if (!t.categoryId) continue;
    priorMonthByCategory.set(t.categoryId, (priorMonthByCategory.get(t.categoryId) ?? 0) + t.amount);
  }
  const priorMonthLabel = priorMonthStart.toLocaleDateString(undefined, { month: "long" });

  const goalsRawGroup = rawGroups.find((g) => GOAL_ROOT_CATEGORIES.has(g.name));
  const goalCategoryIds = goalsRawGroup?.children.map((c) => c.id) ?? [];

  const [goalRecords, allTimeContributions, recentContributions] = await Promise.all([
    prisma.goal.findMany({ where: { userId, categoryId: { in: goalCategoryIds } } }),
    goalCategoryIds.length > 0
      ? prisma.transaction.groupBy({
          by: ["categoryId"],
          where: { userId, categoryId: { in: goalCategoryIds }, amount: { gt: 0 } },
          _sum: { amount: true },
        })
      : Promise.resolve([]),
    goalCategoryIds.length > 0
      ? prisma.transaction.groupBy({
          by: ["categoryId"],
          where: { userId, categoryId: { in: goalCategoryIds }, amount: { gt: 0 }, date: { gte: threeMonthsAgo } },
          _sum: { amount: true },
        })
      : Promise.resolve([]),
  ]);

  const goalById = new Map(goalRecords.map((g) => [g.categoryId, g]));
  const allTimeByCategory = new Map(allTimeContributions.map((r) => [r.categoryId, r._sum.amount ?? 0]));
  const recentByCategory = new Map(recentContributions.map((r) => [r.categoryId, r._sum.amount ?? 0]));

  const goalRows: GoalRow[] = (goalsRawGroup?.children ?? []).map((c) => {
    const g = goalById.get(c.id);
    return {
      categoryId: c.id,
      name: c.name,
      icon: c.icon || "🌱",
      goalId: g?.id ?? null,
      targetAmount: g?.targetAmount ?? null,
      targetDate: g?.targetDate ? g.targetDate.toISOString() : null,
      totalContributed: allTimeByCategory.get(c.id) ?? 0,
      monthlyRate: (recentByCategory.get(c.id) ?? 0) / 3,
    };
  });
  const totalSaved = goalRows.reduce((sum, g) => sum + g.totalContributed, 0);

  const groups = rawGroups.map((g) => ({
    ...aggregate(g),
    isIncome: INCOME_ROOT_CATEGORIES.has(g.name),
    isGoals: GOAL_ROOT_CATEGORIES.has(g.name),
  }));

  const expenseGroups = groups.filter((g) => !g.isIncome);
  const totalBudget = expenseGroups.reduce((sum, g) => sum + g.totalBudget, 0);
  const totalSpent = expenseGroups.reduce((sum, g) => sum + g.totalSpent, 0);
  const left = totalBudget - totalSpent;
  const pct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  return (
    <div className="space-y-6 px-5 pt-6">
      <h1 className="text-xl font-black">Plan</h1>

      <div className="flex items-center justify-between rounded-2xl bg-surface p-4 shadow-sm">
        <div>
          <p className="text-sm text-secondary/70">
            ${Math.max(0, left).toLocaleString(undefined, { maximumFractionDigits: 0 })} left
          </p>
          <p className="text-xs text-secondary/50">of proposed budget this month</p>
        </div>
        <CircularProgress
          pct={pct}
          label={`$${totalSpent.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          sublabel={`of $${totalBudget.toLocaleString(undefined, { maximumFractionDigits: 0 })} proposed`}
        />
      </div>

      <BudgetFeedback />

      <div>
        <h2 className="mb-3 text-sm font-semibold text-secondary/70">Categories</h2>
        {groups.length === 0 ? (
          <p className="text-sm text-secondary/60">No categories yet.</p>
        ) : (
          <ul className="space-y-2">
            {groups.map((group) => {
              const leaves = flattenLeaves(group, group.isIncome).map((leaf) => {
                const priorAmount = priorMonthByCategory.get(leaf.id) ?? 0;
                const rolloverAmount =
                  !group.isIncome && leaf.rolloverEnabled ? Math.max(0, (leaf.monthlyLimit ?? 0) - priorAmount) : 0;
                return {
                  ...leaf,
                  priorAmount: group.isIncome ? undefined : priorAmount,
                  rolloverAmount,
                };
              });
              return (
                <li key={group.id} className="rounded-2xl bg-surface shadow-sm">
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
                      ) : group.isGoals ? (
                        totalSaved > 0 && (
                          <span className="text-xs font-semibold text-brand-green">
                            ${totalSaved.toLocaleString(undefined, { maximumFractionDigits: 0 })} saved
                          </span>
                        )
                      ) : group.totalBudget > 0 ? (
                        <span className="text-xs text-secondary/60">
                          ${group.totalSpent.toLocaleString(undefined, { maximumFractionDigits: 0 })} / $
                          {group.totalBudget.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                      ) : (
                        group.totalSpent > 0 && (
                          <span className="text-xs text-secondary/50">
                            ${group.totalSpent.toLocaleString(undefined, { maximumFractionDigits: 0 })} spent
                          </span>
                        )
                      )}
                      <svg
                        viewBox="0 0 20 20"
                        className="h-4 w-4 shrink-0 text-secondary/40 transition-transform group-open:rotate-180"
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
                    <div className="space-y-3 border-t border-divider px-4 py-3">
                      {group.isGoals ? (
                        <GoalList goals={goalRows} />
                      ) : (
                        <CategoryList categories={leaves} isIncome={group.isIncome} priorMonthLabel={priorMonthLabel} />
                      )}
                      <AddCategoryForm parentId={group.id} label="Add subcategory" />
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        )}
        <div className="mt-2">
          <AddCategoryForm parentId={null} label="Add category" />
        </div>
      </div>
    </div>
  );
}
