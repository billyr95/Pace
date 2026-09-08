import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { detectRecurringBills } from "@/lib/recurring";
import { generateGeminiText } from "@/lib/gemini";

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const now = new Date();
  const sixMonthsAgoStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const oneYearAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const [allCategories, tx, billCandidates] = await Promise.all([
    prisma.category.findMany({ where: { userId }, select: { id: true, name: true, parentId: true } }),
    prisma.transaction.findMany({
      where: { userId, date: { gte: sixMonthsAgoStart } },
      select: { amount: true, date: true, categoryId: true },
    }),
    prisma.transaction.findMany({
      where: { userId, date: { gte: oneYearAgo } },
      select: { amount: true, date: true, name: true, merchantName: true },
    }),
  ]);

  if (tx.length === 0) {
    return NextResponse.json({
      feedback: "Not enough transaction history yet — check back after a month or two of activity.",
    });
  }

  const categoryById = new Map(allCategories.map((c) => [c.id, c]));
  function topLevelName(categoryId: string | null): string | null {
    let current = categoryId ? categoryById.get(categoryId) : undefined;
    while (current?.parentId) current = categoryById.get(current.parentId);
    return current?.name ?? null;
  }

  const monthKeys: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthKeys.push(d.toLocaleDateString(undefined, { month: "short", year: "2-digit" }));
  }
  const monthIndexOf = (date: Date) => {
    const diff = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
    return 5 - diff;
  };

  const totalSpendByMonth = new Array(6).fill(0);
  const totalIncomeByMonth = new Array(6).fill(0);
  const spendByCategoryByMonth = new Map<string, number[]>();

  for (const t of tx) {
    const idx = monthIndexOf(t.date);
    if (idx < 0 || idx > 5) continue;
    if (t.amount > 0) {
      totalSpendByMonth[idx] += t.amount;
      const name = topLevelName(t.categoryId);
      if (name) {
        const arr = spendByCategoryByMonth.get(name) ?? new Array(6).fill(0);
        arr[idx] += t.amount;
        spendByCategoryByMonth.set(name, arr);
      }
    } else {
      totalIncomeByMonth[idx] += -t.amount;
    }
  }

  const topCategories = Array.from(spendByCategoryByMonth.entries())
    .sort((a, b) => b[1].reduce((s, n) => s + n, 0) - a[1].reduce((s, n) => s + n, 0))
    .slice(0, 6);

  const upcomingBillsTotal = detectRecurringBills(billCandidates, now).reduce((s, b) => s + b.averageAmount, 0);
  const avgIncome = totalIncomeByMonth.reduce((s, n) => s + n, 0) / 6;
  const avgSpend = totalSpendByMonth.reduce((s, n) => s + n, 0) / 6;

  const prompt = `You are a friendly, plain-spoken financial analyst inside a budgeting app called Pace. Analyze this user's last 6 months of data and respond in 4-6 sentences, no markdown: first, call out 1-2 notable spending trends (a category clearly trending up or down, or unusually volatile) using specific numbers; then give a cash-flow forecast for next month — a single expected net number (income minus typical expenses minus known upcoming bills) with a one-sentence reason. Be specific and concrete, not generic.

Months (oldest to newest): ${monthKeys.join(", ")}
Total spend by month: ${totalSpendByMonth.map((n) => `$${Math.round(n)}`).join(", ")}
Total income by month: ${totalIncomeByMonth.map((n) => `$${Math.round(n)}`).join(", ")}
Average monthly income: $${Math.round(avgIncome)}
Average monthly spend: $${Math.round(avgSpend)}
Known upcoming recurring bills (monthly total): $${Math.round(upcomingBillsTotal)}

Spend by category, oldest to newest month:
${topCategories.map(([name, arr]) => `- ${name}: ${arr.map((n) => `$${Math.round(n)}`).join(", ")}`).join("\n")}`;

  try {
    const feedback = await generateGeminiText(prompt);
    return NextResponse.json({ feedback });
  } catch (err) {
    console.error("gemini trends-forecast failed:", err);
    return NextResponse.json({ error: "Couldn't get an analysis right now — try again in a moment." }, { status: 502 });
  }
}
