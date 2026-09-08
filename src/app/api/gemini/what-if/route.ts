import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { aggregate, flattenLeaves } from "@/lib/category-tree";
import { INCOME_ROOT_CATEGORIES } from "@/lib/default-categories";
import { expectedMonthlyIncome, type PayFrequency } from "@/lib/income";
import { generateGeminiText } from "@/lib/gemini";

const bodySchema = z.object({ question: z.string().trim().min(3).max(300) });

function extractJson(text: string): unknown {
  const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  return JSON.parse(cleaned);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Ask a specific question, like \"What if my rent went up to $2,000?\"" }, { status: 400 });
  }
  const userId = session.user.id;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
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

  const groups = rawGroups.map((g) => ({ ...aggregate(g), isIncome: INCOME_ROOT_CATEGORIES.has(g.name) }));
  const expenseGroups = groups.filter((g) => !g.isIncome);
  const totalBudget = expenseGroups.reduce((sum, g) => sum + g.totalBudget, 0);
  const totalSpent = expenseGroups.reduce((sum, g) => sum + g.totalSpent, 0);

  const categoryAmounts = new Map<string, number>();
  for (const group of expenseGroups) {
    for (const leaf of flattenLeaves(group, false)) {
      categoryAmounts.set(leaf.name.toLowerCase(), leaf.monthlyLimit && leaf.monthlyLimit > 0 ? leaf.monthlyLimit : leaf.amount);
    }
    categoryAmounts.set(group.name.toLowerCase(), group.totalBudget > 0 ? group.totalBudget : group.totalSpent);
  }
  const categoryNames = Array.from(new Set([...expenseGroups.map((g) => g.name), ...expenseGroups.flatMap((g) => flattenLeaves(g, false).map((l) => l.name))]));

  const recentMonthlyAvg = recentIncomeTx.reduce((sum, t) => sum - t.amount, 0) / 3;
  const expectedThisMonth = expectedMonthlyIncome(
    incomeProfile ? { frequency: incomeProfile.frequency as PayFrequency, amount: incomeProfile.amount } : null,
    recentMonthlyAvg,
  );
  const currentSavings = expectedThisMonth - (totalBudget > 0 ? totalBudget : totalSpent);

  const extractionPrompt = `A user of a budgeting app asked a "what if" question about changing one of their spending categories. Their categories are: ${categoryNames.join(", ")}.

Question: "${parsed.data.question}"

Respond with ONLY a JSON object (no markdown, no explanation) in this exact shape:
{"category": "<the single best-matching category name from the list above, or null if none match>", "newMonthlyAmount": <the new monthly dollar amount implied by the question, as a number, or null if not specified>, "label": "<a short 2-4 word label for this scenario, e.g. 'New apartment'>"}`;

  let extracted: { category: string | null; newMonthlyAmount: number | null; label: string };
  try {
    const raw = await generateGeminiText(extractionPrompt);
    extracted = extractJson(raw) as typeof extracted;
  } catch (err) {
    console.error("gemini what-if extraction failed:", err);
    return NextResponse.json({ error: "Couldn't understand that scenario — try rephrasing with a specific category and dollar amount." }, { status: 502 });
  }

  if (!extracted.category || extracted.newMonthlyAmount == null || !Number.isFinite(extracted.newMonthlyAmount)) {
    return NextResponse.json({
      error: "Couldn't match that to one of your categories — try naming a specific category and dollar amount, like \"What if groceries went up to $500?\"",
    }, { status: 422 });
  }

  const currentAmount = categoryAmounts.get(extracted.category.toLowerCase()) ?? 0;
  const newAmount = extracted.newMonthlyAmount;
  const difference = newAmount - currentAmount;
  const newSavings = currentSavings - difference;

  return NextResponse.json({
    label: extracted.label || extracted.category,
    category: extracted.category,
    currentAmount,
    newAmount,
    difference,
    currentSavings,
    newSavings,
  });
}
