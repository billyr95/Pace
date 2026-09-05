import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PAY_FREQUENCIES } from "@/lib/income";

const bodySchema = z.object({
  frequency: z.enum(PAY_FREQUENCIES),
  amount: z.number().min(0).max(1_000_000).nullable(),
  variable: z.boolean(),
});

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { frequency, amount, variable } = parsed.data;
  await prisma.incomeProfile.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, frequency, amount, variable },
    update: { frequency, amount, variable },
  });

  return NextResponse.json({ ok: true });
}
