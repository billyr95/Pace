import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { aggregate } from "@/lib/category-tree";
import { INCOME_ROOT_CATEGORIES } from "@/lib/default-categories";
import { topNWithOther, CATEGORICAL_PALETTE } from "@/lib/chart-palette";
import { expectedMonthlyIncome, type PayFrequency } from "@/lib/income";
import { DATE_RANGES, isDateRangeKey, type DateRangeKey } from "@/lib/date-range";
import { detectRecurringIncome } from "@/lib/recurring";
import { detectMoneyLeaks } from "@/lib/money-leaks";
import { computeSpendingPersonality } from "@/lib/spending-personality";
import { DateRangeSelect } from "@/components/date-range-select";
import { SpendPieChart } from "@/components/spend-pie-chart";
import { CategorySpendBars } from "@/components/spend-bars";
import { IncomeSetupForm, type IncomeProfileData } from "@/components/income-setup-form";
import { MoneyLeaksCard } from "@/components/money-leaks-card";
import { SpendingPersonalityCard } from "@/components/spending-personality-card";
import { MonthlyRecapCard } from "@/components/monthly-recap-card";
import { IncomeSourcesCard } from "@/components/income-sources-card";
import { TrendsForecastCard } from "@/components/trends-forecast-card";
import { WhatIfCard } from "@/components/what-if-card";

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const session = await auth();
  const userId = session!.user.id;

  const { range: rangeParam } = await searchParams;
  const range: DateRangeKey = isDateRangeKey(rangeParam) ? rangeParam : "this_month";

  const now = new Date();
  const rangeStart = DATE_RANGES[range].since(now);
  const rangeEnd = DATE_RANGES[range].until(now);
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const txSelect = { where: { date: { gte: rangeStart, lt: rangeEnd } }, select: { amount: true } } as const;

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
  // So a category's bar below starts with the same hue as its pie slice, instead of every
  // bar independently restarting its own color sequence at blue.
  const paletteIndex = (color: string) => Math.max(0, CATEGORICAL_PALETTE.indexOf(color));
  const expenseColorIndex = new Map(pieSlices.map((s) => [s.name, paletteIndex(s.color)]));

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
        expenseColorIndex.get(g.name) ?? 0,
      ),
    }))
    .filter((g) => g.segments.length > 0);

  // Money In is one root with a middle tier (Income / Other Money In / Advances), so it mirrors
  // the expense breakdown one level down: mid-tier nodes stand in for "categories", their own
  // children become the bar segments.
  const incomeGroup = groups.find((g) => g.isIncome);
  const totalReceived = incomeGroup?.totalReceived ?? 0;
  const incomePieSlices = incomeGroup
    ? topNWithOther(
        incomeGroup.children.map((c) => ({ name: c.name, amount: c.totalReceived })),
        8,
      )
    : [];
  const incomeColorIndex = new Map(incomePieSlices.map((s) => [s.name, paletteIndex(s.color)]));
  const incomeBarGroups = (incomeGroup?.children ?? [])
    .filter((c) => c.totalReceived > 0)
    .sort((a, b) => b.totalReceived - a.totalReceived)
    .map((c) => ({
      id: c.id,
      name: c.name,
      icon: incomeGroup!.icon,
      total: c.totalReceived,
      segments: topNWithOther(
        c.children.map((leaf) => ({ name: leaf.name, amount: leaf.totalReceived })),
        8,
        incomeColorIndex.get(c.name) ?? 0,
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

  // --- Money leaks, spending personality, monthly recap, recurring income ---
  const sixMonthsAgoStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const threeMonthsAgoStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  const recapMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const recapMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);
  const oneYearAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const [allCategories, personalityTx, leakTx, recapTx, incomeCandidates] = await Promise.all([
    prisma.category.findMany({ where: { userId }, select: { id: true, name: true, parentId: true } }),
    prisma.transaction.findMany({
      where: { userId, date: { gte: sixMonthsAgoStart }, amount: { gt: 0 } },
      select: { amount: true, date: true, categoryId: true },
    }),
    prisma.transaction.findMany({
      where: { userId, date: { gte: threeMonthsAgoStart }, amount: { gt: 0, lte: 20 } },
      include: { category: { select: { name: true } } },
    }),
    prisma.transaction.findMany({
      where: { userId, date: { gte: recapMonthStart, lt: recapMonthEnd } },
      include: { category: { select: { name: true } } },
    }),
    prisma.transaction.findMany({
      where: { userId, date: { gte: oneYearAgo }, amount: { lt: 0 } },
      select: { amount: true, date: true, name: true, merchantName: true },
    }),
  ]);

  const categoryById = new Map(allCategories.map((c) => [c.id, c]));
  function topLevelName(categoryId: string | null): string | null {
    let current = categoryId ? categoryById.get(categoryId) : undefined;
    while (current?.parentId) {
      current = categoryById.get(current.parentId);
    }
    return current?.name ?? null;
  }

  const monthKeys: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthKeys.push(`${d.getFullYear()}-${d.getMonth()}`);
  }
  const personality = computeSpendingPersonality(
    personalityTx.map((t) => ({ amount: t.amount, date: t.date, categoryName: topLevelName(t.categoryId) })),
    monthKeys,
  );

  const moneyLeaks = detectMoneyLeaks(
    leakTx.map((t) => ({ amount: t.amount, categoryName: t.category?.name ?? null })),
    3,
  ).slice(0, 3);

  const recapEarned = recapTx.filter((t) => t.amount < 0).reduce((sum, t) => sum - t.amount, 0);
  const recapExpenseTx = recapTx.filter((t) => t.amount > 0);
  const recapSpent = recapExpenseTx.reduce((sum, t) => sum + t.amount, 0);
  // Fixed/essential costs (rent, utilities, loan payments) would dominate a raw category-total
  // ranking every month — excluding them surfaces an actual discretionary "splurge" instead.
  const SPLURGE_EXCLUDED_GROUPS = new Set(["Home", "Financial"]);
  const recapByCategory = new Map<string, number>();
  for (const t of recapExpenseTx) {
    if (!t.category?.name) continue;
    if (SPLURGE_EXCLUDED_GROUPS.has(topLevelName(t.categoryId) ?? "")) continue;
    recapByCategory.set(t.category.name, (recapByCategory.get(t.category.name) ?? 0) + t.amount);
  }
  const recapBiggestSplurge = Array.from(recapByCategory.entries())
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)[0];
  const recapMonthLabel = recapMonthStart.toLocaleDateString(undefined, { month: "long" });
  const recapSaved = recapEarned - recapSpent;
  const recapSavingsRate = recapEarned > 0 ? Math.round((recapSaved / recapEarned) * 100) : 0;

  const recurringIncome = detectRecurringIncome(incomeCandidates, now);

  const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;
  const rangePhrase = DATE_RANGES[range].phrase(now);

  return (
    <div className="space-y-6 px-5 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black">Insights</h1>
        <DateRangeSelect value={range} now={now} />
      </div>

      <div className="rounded-2xl bg-surface p-4 shadow-sm">
        <p className="text-sm text-secondary/70">Spent {rangePhrase}</p>
        <p className="text-2xl font-black">{fmt(totalSpent)}</p>
      </div>

      {pieSlices.length > 0 && (
        <div className="rounded-2xl bg-surface p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-secondary/70">Spend by category</h2>
          <SpendPieChart slices={pieSlices} total={totalSpent} rangePhrase={rangePhrase} />
        </div>
      )}

      {barGroups.length > 0 && (
        <div className="rounded-2xl bg-surface p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-secondary/70">Breakdown by category</h2>
          <CategorySpendBars groups={barGroups} />
        </div>
      )}

      {expenseGroups.length === 0 && (
        <p className="text-sm text-secondary/60">
          No categorized spending {rangePhrase} yet — try a wider range above, or categorize some transactions.
        </p>
      )}

      <div className="rounded-2xl bg-surface p-4 shadow-sm">
        <p className="text-sm text-secondary/70">Received {rangePhrase}</p>
        <p className="text-2xl font-black">{fmt(totalReceived)}</p>
      </div>

      {incomePieSlices.length > 0 && (
        <div className="rounded-2xl bg-surface p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-secondary/70">Money in by category</h2>
          <SpendPieChart slices={incomePieSlices} total={totalReceived} rangePhrase={rangePhrase} verb="received" />
        </div>
      )}

      {incomeBarGroups.length > 0 && (
        <div className="rounded-2xl bg-surface p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-secondary/70">Money in breakdown</h2>
          <CategorySpendBars groups={incomeBarGroups} />
        </div>
      )}

      <div className="rounded-2xl bg-surface p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-secondary/70">Income</h2>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div>
            <p className="text-lg font-black">{fmt(ytdIncome)}</p>
            <p className="text-xs text-secondary/50">made this year</p>
          </div>
          <div>
            <p className="text-lg font-black">{fmt(expectedThisMonth)}</p>
            <p className="text-xs text-secondary/50">expected this month</p>
          </div>
          <div>
            <p className="text-lg font-black">{fmt(recentMonthlyAvg)}</p>
            <p className="text-xs text-secondary/50">avg. per month (last 90 days)</p>
          </div>
          <div>
            <p className="text-lg font-black">{fmt(projectedAnnual)}</p>
            <p className="text-xs text-secondary/50">projected this year</p>
          </div>
        </div>

        <div className="border-t border-divider pt-3">
          <p className="mb-2 text-xs font-medium text-secondary/70">Pay schedule</p>
          <IncomeSetupForm profile={profileData} />
        </div>
      </div>

      <IncomeSourcesCard sources={recurringIncome} />

      <MonthlyRecapCard
        monthLabel={recapMonthLabel}
        earned={recapEarned}
        spent={recapSpent}
        saved={recapSaved}
        savingsRatePct={recapSavingsRate}
        biggestSplurge={recapBiggestSplurge}
      />

      <MoneyLeaksCard leaks={moneyLeaks} />

      <SpendingPersonalityCard personality={personality} />

      <TrendsForecastCard />

      <WhatIfCard />
    </div>
  );
}
