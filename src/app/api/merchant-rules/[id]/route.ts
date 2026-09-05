import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({ categoryId: z.string() });

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

  const rule = await prisma.merchantRule.findUnique({ where: { id } });
  if (!rule || rule.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const category = await prisma.category.findUnique({
    where: { id: parsed.data.categoryId },
    include: { _count: { select: { children: true } } },
  });
  const isUnselectableGroup = !category?.parentId && (category?._count.children ?? 0) > 0;
  if (!category || category.userId !== session.user.id || isUnselectableGroup) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  await prisma.merchantRule.update({ where: { id }, data: { categoryId: parsed.data.categoryId } });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const rule = await prisma.merchantRule.findUnique({ where: { id } });
  if (!rule || rule.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.merchantRule.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
