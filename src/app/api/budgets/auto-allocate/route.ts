import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { BUDGET_ALLOCATION_WEIGHTS } from "@/lib/budget-weights";

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const incomeTransactions = await prisma.transaction.findMany({
    where: { userId, date: { gte: thirtyDaysAgo }, amount: { lt: 0 } },
    select: { amount: true },
  });
  const income = incomeTransactions.reduce((sum, t) => sum - t.amount, 0);

  if (income <= 0) {
    return NextResponse.json(
      { error: "No income found in the last 30 days yet — connect an account or add some income transactions first." },
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
