import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { aggregate, flattenLeaves } from "@/lib/category-tree";
import { INCOME_ROOT_CATEGORIES, GOAL_ROOT_CATEGORIES } from "@/lib/default-categories";
import { expectedMonthlyIncome, type PayFrequency } from "@/lib/income";
import { generateGeminiText } from "@/lib/gemini";

const bodySchema = z.object({ categoryId: z.string() });

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const userId = session.user.id;
  const { categoryId } = parsed.data;

  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category || category.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const txSelect = { where: { date: { gte: monthStart } }, select: { amount: true } } as const;

  const [goal, contributed, rawGroups, incomeProfile, recentIncomeTx] = await Promise.all([
    prisma.goal.findUnique({ where: { categoryId } }),
    prisma.transaction.aggregate({ where: { userId, categoryId, amount: { gt: 0 } }, _sum: { amount: true } }),
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
  const expenseGroups = groups.filter((g) => !g.isIncome && !g.isGoals);

  const roomToSpare: string[] = [];
  for (const group of expenseGroups) {
    for (const leaf of flattenLeaves(group, false)) {
      if (leaf.monthlyLimit && leaf.monthlyLimit > 0) {
        const left = leaf.monthlyLimit - leaf.amount;
        if (left > 20) roomToSpare.push(`${leaf.name}: $${left.toFixed(0)} left of $${leaf.monthlyLimit.toFixed(0)} budget`);
      }
    }
  }

  const recentMonthlyAvg = recentIncomeTx.reduce((sum, t) => sum - t.amount, 0) / 3;
  const expectedThisMonth = expectedMonthlyIncome(
    incomeProfile ? { frequency: incomeProfile.frequency as PayFrequency, amount: incomeProfile.amount } : null,
    recentMonthlyAvg,
  );
  const totalBudget = expenseGroups.reduce((sum, g) => sum + g.totalBudget, 0);
  const totalSpent = expenseGroups.reduce((sum, g) => sum + g.totalSpent, 0);

  const contributedTotal = contributed._sum.amount ?? 0;
  const targetAmount = goal?.targetAmount;
  const targetDate = goal?.targetDate;

  const prompt = `You are a friendly, practical financial coach inside a budgeting app called Pace. The user has a savings goal called "${category.name}"${targetAmount ? ` with a target of $${targetAmount.toFixed(0)}` : ""}${targetDate ? `, aiming to reach it by ${targetDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })}` : ""}. So far they've put $${contributedTotal.toFixed(0)} toward it.

Their expected monthly income is about $${expectedThisMonth.toFixed(0)}. Their overall monthly expense budget is $${totalBudget.toFixed(0)}, and they've spent $${totalSpent.toFixed(0)} so far this month.

${roomToSpare.length > 0 ? `Categories with unspent budget room this month:\n${roomToSpare.join("\n")}` : "No categories currently have meaningful unspent budget room."}

In 2-4 sentences (no markdown), give a concrete, encouraging suggestion for how they could realistically save toward this goal — reference specific categories or a specific monthly amount where possible. If they're already on a good pace, say so plainly instead of inventing a problem.`;

  try {
    const suggestion = await generateGeminiText(prompt);
    return NextResponse.json({ suggestion });
  } catch (err) {
    console.error("gemini goal-suggestion failed:", err);
    return NextResponse.json({ error: "Couldn't get a suggestion right now — try again in a moment." }, { status: 502 });
  }
}
