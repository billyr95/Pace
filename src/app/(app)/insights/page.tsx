import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { aggregate } from "@/lib/category-tree";
import { INCOME_ROOT_CATEGORIES } from "@/lib/default-categories";
import { topNWithOther } from "@/lib/chart-palette";
import { expectedMonthlyIncome, type PayFrequency } from "@/lib/income";
import { SpendPieChart } from "@/components/spend-pie-chart";
import { CategorySpendBars } from "@/components/spend-bars";
import { IncomeSetupForm, type IncomeProfileData } from "@/components/income-setup-form";

export default async function InsightsPage() {
  const session = await auth();
  const userId = session!.user.id;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const txSelect = { where: { date: { gte: monthStart } }, select: { amount: true } } as const;

  const [rawGroups, incomeProfile, ytdIncomeTx, recentIncomeTx] = await Promise.all([
    prisma.category.findMany({
      where: { userId, parentId: null },
      include: {
        transactions: txSelect,
        children: {
          include: {
            transactions: txSelect,
            children: { include: { transactions: txSelect } },
          },
        },
      },
    }),
    prisma.incomeProfile.findUnique({ where: { userId } }),
    prisma.transaction.findMany({ where: { userId, date: { gte: yearStart }, amount: { lt: 0 } }, select: { amount: true } }),
    prisma.transaction.findMany({ where: { userId, date: { gte: ninetyDaysAgo }, amount: { lt: 0 } }, select: { amount: true } }),
  ]);

  const groups = rawGroups.map((g) => ({ ...aggregate(g), isIncome: INCOME_ROOT_CATEGORIES.has(g.name) }));
  const expenseGroups = groups.filter((g) => !g.isIncome && g.totalSpent > 0);
  const totalSpent = expenseGroups.reduce((sum, g) => sum + g.totalSpent, 0);

  const pieSlices = topNWithOther(
    expenseGroups.map((g) => ({ name: g.name, amount: g.totalSpent })),
    8,
  );

  const barGroups = [...expenseGroups]
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .map((g) => ({
      id: g.id,
      name: g.name,
      icon: g.icon,
      total: g.totalSpent,
      segments: topNWithOther(
        g.children.map((c) => ({ name: c.name, amount: c.totalSpent })),
        8,
      ),
    }))
    .filter((g) => g.segments.length > 0);

  const ytdIncome = ytdIncomeTx.reduce((sum, t) => sum - t.amount, 0);
  const recentMonthlyAvg = recentIncomeTx.reduce((sum, t) => sum - t.amount, 0) / 3;
  const profileData: IncomeProfileData = incomeProfile
    ? { frequency: incomeProfile.frequency as PayFrequency, amount: incomeProfile.amount, variable: incomeProfile.variable }
    : null;
  const expectedThisMonth = expectedMonthlyIncome(incomeProfile, recentMonthlyAvg);
  const monthsRemaining = 11 - now.getMonth();
  const projectedAnnual = ytdIncome + expectedThisMonth * monthsRemaining;

  const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;

  return (
    <div className="space-y-6 px-5 pt-6">
      <h1 className="text-xl font-black">Insights</h1>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-sm text-brand-forest/70">Spent this month</p>
        <p className="text-2xl font-black">{fmt(totalSpent)}</p>
      </div>

      {pieSlices.length > 0 && (
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-brand-forest/70">Spend by category</h2>
          <SpendPieChart slices={pieSlices} total={totalSpent} />
        </div>
      )}

      {barGroups.length > 0 && (
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-brand-forest/70">Breakdown by category</h2>
          <CategorySpendBars groups={barGroups} />
        </div>
      )}

      {expenseGroups.length === 0 && (
        <p className="text-sm text-brand-forest/60">Spending breakdowns will appear here once you have transactions.</p>
      )}

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-brand-forest/70">Income</h2>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div>
            <p className="text-lg font-black">{fmt(ytdIncome)}</p>
            <p className="text-xs text-brand-forest/50">made this year</p>
          </div>
          <div>
            <p className="text-lg font-black">{fmt(expectedThisMonth)}</p>
            <p className="text-xs text-brand-forest/50">expected this month</p>
          </div>
          <div>
            <p className="text-lg font-black">{fmt(recentMonthlyAvg)}</p>
            <p className="text-xs text-brand-forest/50">avg. per month (last 90 days)</p>
          </div>
          <div>
            <p className="text-lg font-black">{fmt(projectedAnnual)}</p>
            <p className="text-xs text-brand-forest/50">projected this year</p>
          </div>
        </div>

        <div className="border-t border-brand-mist pt-3">
          <p className="mb-2 text-xs font-medium text-brand-forest/70">Pay schedule</p>
          <IncomeSetupForm profile={profileData} />
        </div>
      </div>
    </div>
  );
}
