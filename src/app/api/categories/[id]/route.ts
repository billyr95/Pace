import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z
  .object({
    monthlyLimit: z.number().min(0).max(1_000_000).optional(),
    rolloverEnabled: z.boolean().optional(),
  })
  .refine((v) => v.monthlyLimit !== undefined || v.rolloverEnabled !== undefined, {
    message: "No fields to update",
  });

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

  const category = await prisma.category.findUnique({ where: { id } });
  if (!category || category.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { monthlyLimit, rolloverEnabled } = parsed.data;
  await prisma.category.update({
    where: { id },
    data: {
      ...(monthlyLimit !== undefined ? { monthlyLimit } : {}),
      ...(rolloverEnabled !== undefined ? { rolloverEnabled } : {}),
    },
  });
  return NextResponse.json({ ok: true });
}
