import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  name: z.string().trim().min(1).max(40),
  icon: z.string().trim().max(8).optional(),
  parentId: z.string().nullable().optional(),
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

  const { name, parentId } = parsed.data;
  const icon = parsed.data.icon || "🏷️";

  if (parentId) {
    const parent = await prisma.category.findUnique({ where: { id: parentId } });
    if (!parent || parent.userId !== session.user.id) {
      return NextResponse.json({ error: "Invalid parent category" }, { status: 400 });
    }
  }

  try {
    const category = await prisma.category.create({
      data: { userId: session.user.id, parentId: parentId ?? null, name, icon },
    });
    return NextResponse.json({ ok: true, category });
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "code" in err && err.code === "P2002") {
      return NextResponse.json({ error: "A category with this name already exists here" }, { status: 409 });
    }
    throw err;
  }
}
