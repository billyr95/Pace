import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { aggregate, flattenLeaves } from "@/lib/category-tree";
import { INCOME_ROOT_CATEGORIES, GOAL_ROOT_CATEGORIES } from "@/lib/default-categories";
import { expectedMonthlyIncome, type PayFrequency } from "@/lib/income";
import { generateGeminiText } from "@/lib/gemini";

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const daysInMonth = monthEnd.getDate();
  const dayOfMonth = now.getDate();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const txSelect = { where: { date: { gte: monthStart } }, select: { amount: true } } as const;

  const [rawGroups, incomeProfile, recentIncomeTx] = await Promise.all([
    prisma.category.findMany({
      where: { userId, parentId: null },
      include: {
        transactions: txSelect,
        children: { include: { transactions: txSelect, children: { include: { transactions: txSelect } } } },
      },
    }),
    prisma.incomeProfile.findUnique({ where: { userId } }),
    prisma.transaction.findMany({ where: { userId, date: { gte: ninetyDaysAgo }, amount: { lt: 0 } }, select: { amount: true } }),
  ]);

  const groups = rawGroups.map((g) => ({
    ...aggregate(g),
    isIncome: INCOME_ROOT_CATEGORIES.has(g.name),
    isGoals: GOAL_ROOT_CATEGORIES.has(g.name),
  }));

  const expenseGroups = groups.filter((g) => !g.isIncome);
  const totalBudget = expenseGroups.reduce((sum, g) => sum + g.totalBudget, 0);
  const totalSpent = expenseGroups.reduce((sum, g) => sum + g.totalSpent, 0);

  const incomeGroup = groups.find((g) => g.isIncome);
  const totalReceived = incomeGroup?.totalReceived ?? 0;
  const recentMonthlyAvg = recentIncomeTx.reduce((sum, t) => sum - t.amount, 0) / 3;
  const expectedThisMonth = expectedMonthlyIncome(
    incomeProfile ? { frequency: incomeProfile.frequency as PayFrequency, amount: incomeProfile.amount } : null,
    recentMonthlyAvg,
  );

  const categoryLines: string[] = [];
  for (const group of expenseGroups) {
    const leaves = flattenLeaves(group, false);
    for (const leaf of leaves) {
      if (leaf.monthlyLimit && leaf.monthlyLimit > 0) {
        categoryLines.push(`- ${leaf.name}: $${leaf.amount.toFixed(0)} spent of $${leaf.monthlyLimit.toFixed(0)} proposed`);
      } else if (leaf.amount > 0) {
        categoryLines.push(`- ${leaf.name}: $${leaf.amount.toFixed(0)} spent (no budget set)`);
      }
    }
  }

  if (totalBudget === 0 && totalSpent === 0 && categoryLines.length === 0) {
    return NextResponse.json({
      feedback: "Not enough data yet — set a few category budgets and categorize some transactions, then check back.",
    });
  }

  const expectedSpendByNow = totalBudget * (dayOfMonth / daysInMonth);
  const estimatedSavings = Math.max(0, totalReceived || expectedThisMonth) - totalSpent;

  const prompt = `You are a friendly, encouraging personal finance assistant inside a budgeting app called Pace, whose tagline is "finance that moves with you, not against you." Give the user a short (3-5 sentence), plain-language check-in on their budget this month. Be specific with numbers, warm but honest, and end with one concrete, actionable suggestion if they're overspending or off pace — otherwise encourage them to keep it up. Do not use markdown formatting, just plain sentences.

Today is day ${dayOfMonth} of ${daysInMonth} this month (${Math.round((dayOfMonth / daysInMonth) * 100)}% through the month).

Overall budget: $${totalSpent.toFixed(0)} spent of $${totalBudget.toFixed(0)} proposed this month.
Pace check: at this point in the month, spending "on pace" would be about $${expectedSpendByNow.toFixed(0)}.
Income this month so far: $${totalReceived.toFixed(0)} (expected around $${expectedThisMonth.toFixed(0)} for the full month).
Estimated savings so far this month (income minus spending): $${estimatedSavings.toFixed(0)}.

Per-category budgets this month:
${categoryLines.length > 0 ? categoryLines.join("\n") : "(no category budgets set yet)"}

Tell them whether they're on track, what it looks like they're saving, and if they're overspending, name the specific category(ies) most responsible and suggest where they could cut back.`;

  try {
    const feedback = await generateGeminiText(prompt);
    return NextResponse.json({ feedback });
  } catch (err) {
    console.error("gemini budget-feedback failed:", err);
    return NextResponse.json({ error: "Couldn't get feedback right now — try again in a moment." }, { status: 502 });
  }
}
