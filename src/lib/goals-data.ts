import { prisma } from "@/lib/prisma";
import { GOAL_ROOT_CATEGORIES } from "@/lib/default-categories";

/**
 * How much more a user should ideally put toward their savings goals before the month is out —
 * each goal's own pace (based on its target date if it has one, else its recent contribution
 * habit) minus whatever's already been contributed this month. Feeds the Safe-to-spend figure.
 */
export async function remainingGoalContributionsThisMonth(userId: string, now: Date): Promise<number> {
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

  const goalsRoot = await prisma.category.findFirst({
    where: { userId, parentId: null, name: { in: Array.from(GOAL_ROOT_CATEGORIES) } },
    include: { children: true },
  });
  const goalCategoryIds = goalsRoot?.children.map((c) => c.id) ?? [];
  if (goalCategoryIds.length === 0) return 0;

  const [goals, allTime, thisMonth, recent] = await Promise.all([
    prisma.goal.findMany({ where: { userId, categoryId: { in: goalCategoryIds } } }),
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { userId, categoryId: { in: goalCategoryIds }, amount: { gt: 0 } },
      _sum: { amount: true },
    }),
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { userId, categoryId: { in: goalCategoryIds }, amount: { gt: 0 }, date: { gte: monthStart } },
      _sum: { amount: true },
    }),
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { userId, categoryId: { in: goalCategoryIds }, amount: { gt: 0 }, date: { gte: threeMonthsAgo } },
      _sum: { amount: true },
    }),
  ]);

  const allTimeMap = new Map(allTime.map((r) => [r.categoryId, r._sum.amount ?? 0]));
  const thisMonthMap = new Map(thisMonth.map((r) => [r.categoryId, r._sum.amount ?? 0]));
  const recentMap = new Map(recent.map((r) => [r.categoryId, r._sum.amount ?? 0]));

  let total = 0;
  for (const goal of goals) {
    const contributed = allTimeMap.get(goal.categoryId) ?? 0;
    const contributedThisMonth = thisMonthMap.get(goal.categoryId) ?? 0;

    let monthlyPace: number;
    if (goal.targetDate) {
      const monthsRemaining = Math.max(
        1,
        (goal.targetDate.getFullYear() - now.getFullYear()) * 12 + (goal.targetDate.getMonth() - now.getMonth()),
      );
      monthlyPace = Math.max(0, (goal.targetAmount - contributed) / monthsRemaining);
    } else {
      monthlyPace = (recentMap.get(goal.categoryId) ?? 0) / 3;
    }

    total += Math.max(0, monthlyPace - contributedThisMonth);
  }
  return total;
}
