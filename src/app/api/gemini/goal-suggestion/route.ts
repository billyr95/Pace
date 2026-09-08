import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { aggregate, flattenLeaves } from "@/lib/category-tree";
import { INCOME_ROOT_CATEGORIES, GOAL_ROOT_CATEGORIES } from "@/lib/default-categories";
import { expectedMonthlyIncome, type PayFrequency } from "@/lib/income";
import { generateGeminiText } from "@/lib/gemini";

const bodySchema = z.object({
  categoryId: z.string(),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), text: z.string() })).max(20).optional(),
  message: z.string().max(500).optional(),
});

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
  const { categoryId, history = [], message } = parsed.data;

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
  const remaining = targetAmount ? Math.max(0, targetAmount - contributedTotal) : null;

  // Computed here, not left to the model — date/division arithmetic is exactly the kind of
  // thing an LLM will confidently get wrong, so it's handed the real number as a fact instead
  // of being asked to derive it.
  let requiredMonthlyPace: number | null = null;
  if (targetAmount && targetDate && remaining !== null) {
    const monthsRemaining = Math.max(
      1,
      (targetDate.getFullYear() - now.getFullYear()) * 12 + (targetDate.getMonth() - now.getMonth()),
    );
    requiredMonthlyPace = remaining / monthsRemaining;
  }

  const context = `You are a friendly, practical financial coach inside a budgeting app called Pace, helping with one specific savings goal. Stay grounded in the facts below — never invent or recompute a dollar figure or date; if you state a monthly savings amount, it must be the exact "required monthly pace" figure given here (do not derive your own from the target and date). Keep replies short (2-4 sentences), plain language, no markdown.

Goal: "${category.name}"${targetAmount ? `, target $${targetAmount.toFixed(0)}` : " (no target amount set)"}${targetDate ? `, target date ${targetDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })}` : ""}.
Contributed so far: $${contributedTotal.toFixed(0)}.
${remaining !== null ? `Remaining to target: $${remaining.toFixed(0)}.` : ""}
${requiredMonthlyPace !== null ? `Required monthly pace to hit the target date: $${requiredMonthlyPace.toFixed(0)}/month.` : ""}

Expected monthly income: $${expectedThisMonth.toFixed(0)}. Overall monthly expense budget: $${totalBudget.toFixed(0)}, spent so far this month: $${totalSpent.toFixed(0)}.
${roomToSpare.length > 0 ? `Categories with unspent budget room this month:\n${roomToSpare.join("\n")}` : "No categories currently have meaningful unspent budget room."}`;

  const transcript = history.map((m) => `${m.role === "user" ? "User" : "You"}: ${m.text}`).join("\n");
  const finalTurn = message
    ? `User: ${message}`
    : `User: How can I save for this goal? (Give your opening suggestion.)`;

  const prompt = [context, transcript, finalTurn].filter(Boolean).join("\n\n") + "\n\nYou:";

  try {
    const reply = await generateGeminiText(prompt);
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("gemini goal-suggestion failed:", err);
    return NextResponse.json({ error: "Couldn't get a response right now — try again in a moment." }, { status: 502 });
  }
}
