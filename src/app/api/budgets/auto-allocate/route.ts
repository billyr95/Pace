import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { BUDGET_ALLOCATION_WEIGHTS } from "@/lib/budget-weights";
import { expectedMonthlyIncome } from "@/lib/income";

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [profile, incomeTransactions] = await Promise.all([
    prisma.incomeProfile.findUnique({ where: { userId } }),
    prisma.transaction.findMany({
      where: { userId, date: { gte: thirtyDaysAgo }, amount: { lt: 0 } },
      select: { amount: true },
    }),
  ]);
  const trailingActual = incomeTransactions.reduce((sum, t) => sum - t.amount, 0);
  // A declared pay schedule is a more reliable basis than 30 days of transaction
  // history, especially for a new account — prefer it when set.
  const income = expectedMonthlyIncome(profile, trailingActual);

  if (income <= 0) {
    return NextResponse.json(
      {
        error:
          "No income to work from yet — set your pay schedule on the Insights tab, or connect an account with some income transactions.",
      },
      { status: 400 },
    );
  }

  const groups = await prisma.category.findMany({
    where: { userId, parentId: null, name: { in: Object.keys(BUDGET_ALLOCATION_WEIGHTS) } },
    include: { children: { select: { id: true } } },
  });

  let categoriesUpdated = 0;
  for (const group of groups) {
    const weight = BUDGET_ALLOCATION_WEIGHTS[group.name] ?? 0;
    if (weight <= 0 || group.children.length === 0) continue;

    const perLeafBudget = Math.round((income * weight) / group.children.length);
    await prisma.category.updateMany({
      where: { id: { in: group.children.map((c) => c.id) } },
      data: { monthlyLimit: perLeafBudget },
    });
    categoriesUpdated += group.children.length;
  }

  return NextResponse.json({ income, categoriesUpdated });
}
