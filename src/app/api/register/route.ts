import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

const DEFAULT_CATEGORIES = [
  { name: "Housing", icon: "home", monthlyLimit: 2000 },
  { name: "Food & Dining", icon: "utensils", monthlyLimit: 700 },
  { name: "Transport", icon: "car", monthlyLimit: 300 },
  { name: "Lifestyle", icon: "shopping-bag", monthlyLimit: 600 },
];

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
    data: {
      name,
      email,
      passwordHash,
      categories: { create: DEFAULT_CATEGORIES },
    },
  });

  return NextResponse.json({ id: user.id, email: user.email });
}
