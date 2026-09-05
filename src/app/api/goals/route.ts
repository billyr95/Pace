import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  categoryId: z.string(),
  targetAmount: z.number().min(1).max(10_000_000),
  targetDate: z.string().nullable().optional(),
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

  const category = await prisma.category.findUnique({ where: { id: parsed.data.categoryId } });
  if (!category || category.userId !== session.user.id) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const targetDate = parsed.data.targetDate ? new Date(parsed.data.targetDate) : null;
  const goal = await prisma.goal.upsert({
    where: { categoryId: parsed.data.categoryId },
    create: {
      userId: session.user.id,
      categoryId: parsed.data.categoryId,
      targetAmount: parsed.data.targetAmount,
      targetDate,
    },
    update: { targetAmount: parsed.data.targetAmount, targetDate },
  });

  return NextResponse.json({ ok: true, goal });
}
