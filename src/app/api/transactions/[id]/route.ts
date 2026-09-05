import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { merchantKey } from "@/lib/merchant-key";

const bodySchema = z.object({ categoryId: z.string().nullable() });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const transaction = await prisma.transaction.findUnique({ where: { id } });
  if (!transaction || transaction.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (parsed.data.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: parsed.data.categoryId },
      include: { _count: { select: { children: true } } },
    });
    // A root category is only rejected when it's a real group with sub-categories underneath
    // it (a header, not selectable). Old pre-hierarchy accounts have childless root categories
    // that ARE meant to be directly assignable.
    const isUnselectableGroup = !category?.parentId && (category?._count.children ?? 0) > 0;
    if (!category || category.userId !== session.user.id || isUnselectableGroup) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }
  }

  await prisma.transaction.update({ where: { id }, data: { categoryId: parsed.data.categoryId } });

  let autoAppliedIds: string[] = [];
  const categoryId = parsed.data.categoryId;
  if (categoryId) {
    const key = merchantKey(transaction);

    await prisma.merchantRule.upsert({
      where: { userId_matchKey: { userId: session.user.id, matchKey: key } },
      create: { userId: session.user.id, matchKey: key, categoryId },
      update: { categoryId },
    });

    // Back-fill other uncategorized transactions from the same merchant (same direction) right away.
    const candidates = await prisma.transaction.findMany({
      where: { userId: session.user.id, categoryId: null, id: { not: id } },
      select: { id: true, name: true, merchantName: true, amount: true },
    });
    autoAppliedIds = candidates.filter((c) => merchantKey(c) === key).map((c) => c.id);
    if (autoAppliedIds.length > 0) {
      await prisma.transaction.updateMany({
        where: { id: { in: autoAppliedIds } },
        data: { categoryId },
      });
    }
  }

  return NextResponse.json({ ok: true, categoryId, autoAppliedIds });
}
