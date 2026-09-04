import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DEFAULT_CATEGORY_TREE, type CategorySeed } from "@/lib/default-categories";

const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

function toCategoryCreateData(userId: string, node: CategorySeed): Prisma.CategoryUncheckedCreateWithoutParentInput {
  return {
    userId,
    name: node.name,
    icon: node.icon ?? "",
    children: node.children?.length
      ? { create: node.children.map((child) => toCategoryCreateData(userId, child)) }
      : undefined,
  };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, email, passwordHash },
  });

  await Promise.all(
    DEFAULT_CATEGORY_TREE.map((group) =>
      prisma.category.create({ data: toCategoryCreateData(user.id, group) }),
    ),
  );

  return NextResponse.json({ id: user.id, email: user.email });
}
